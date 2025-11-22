import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server as HttpServer } from 'http';
import { logger } from '../../utils/logger';
import { performanceCacheService } from '../cache/PerformanceCacheService';
import { EventEmitter } from 'events';

/**
 * Message types for type safety
 */
interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  userId?: string;
  room?: string;
}

/**
 * Connection stats interface
 */
interface ConnectionStats {
  totalConnections: number;
  activeRooms: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
}

/**
 * Room configuration interface
 */
interface RoomConfig {
  maxConnections?: number;
  messageRate?: number;
  persistMessages?: boolean;
  compressionEnabled?: boolean;
}

/**
 * High-performance WebSocket service with advanced optimizations
 */
export class OptimizedWebSocketService extends EventEmitter {
  private io: Server;
  private redis: unknown;
  private connectionPool: Map<string, Socket> = new Map();
  private roomConfigs: Map<string, RoomConfig> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private stats: ConnectionStats = {
    totalConnections: 0,
    activeRooms: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0
  };

  // Performance tracking
  private messageCount = 0;
  private errorCount = 0;
  private latencyMeasurements: number[] = [];
  private lastStatsUpdate = Date.now();

  // Configuration
  private readonly config = {
    batchSize: 100,
    batchInterval: 50, // milliseconds
    maxMessageRate: 100, // messages per second per connection
    heartbeatInterval: 25000,
    heartbeatTimeout: 60000,
    maxConnections: 10000,
    compressionThreshold: 1024, // bytes
    messageRetention: 1000, // number of messages to keep in memory
    rateLimitWindow: 60000, // 1 minute
    maxRoomsPerConnection: 50
  };

  constructor(httpServer: HttpServer) {
    super();
    this.initializeSocketIO(httpServer);
    this.setupRedisAdapter();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize Socket.IO with performance optimizations
   */
  private initializeSocketIO(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      // Performance optimizations
      pingTimeout: this.config.heartbeatTimeout,
      pingInterval: this.config.heartbeatInterval,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true,

      // Compression settings
      compression: true,
      httpCompression: {
        threshold: this.config.compressionThreshold,
        chunkSize: 1024,
        windowBits: 13,
        concurrency: 10
      },

      // CORS configuration
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },

      // Transport configuration
      transports: ['websocket', 'polling'],
      allowUpgrades: true,

      // Connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
      }
    });

    this.setupSocketHandlers();
  }

  /**
   * Setup Redis adapter for horizontal scaling
   */
  private async setupRedisAdapter(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      // Create Redis clients for Socket.IO adapter
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);

      // Setup Socket.IO Redis adapter
      this.io.adapter(createAdapter(pubClient, subClient));

      // Store Redis client for direct operations
      this.redis = pubClient;

      logger.info('Redis adapter configured for WebSocket service');
    } catch (error) {
      logger.error('Failed to setup Redis adapter', error);
      // Continue without Redis adapter for single-instance deployment
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    // Middleware for authentication and rate limiting
    this.io.use(this.authenticationMiddleware.bind(this));
    this.io.use(this.rateLimitMiddleware.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    // Error handler
    this.io.engine.on('connection_error', (err) => {
      this.errorCount++;
      logger.error('WebSocket connection error', err);
    });
  }

  /**
   * Authentication middleware
   */
  private async authenticationMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token (implement your authentication logic here)
      const userId = await this.verifyAuthToken(token);
      if (!userId) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user info to socket
      socket.data.userId = userId;
      socket.data.authenticatedAt = Date.now();

      next();
    } catch (error) {
      logger.error('WebSocket authentication error', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Rate limiting middleware
   */
  private rateLimitMiddleware(socket: Socket, next: (err?: Error) => void): void {
    const clientIp = socket.handshake.address;
    const rateLimitKey = `ws_rate_limit:${clientIp}`;

    // Check rate limit using cache service
    performanceCacheService.increment(rateLimitKey, 1, this.config.rateLimitWindow / 1000)
      .then(count => {
        if (count > this.config.maxMessageRate) {
          return next(new Error('Rate limit exceeded'));
        }
        next();
      })
      .catch(error => {
        logger.error('Rate limit check failed', error);
        next(); // Allow connection on rate limit check failure
      });
  }

  /**
   * Handle new WebSocket connections
   */
  private handleConnection(socket: Socket): void {
    const userId = socket.data.userId;

    logger.info('WebSocket connection established', {
      socketId: socket.id,
      userId,
      clientIp: socket.handshake.address
    });

    // Update connection stats
    this.stats.totalConnections++;
    this.connectionPool.set(socket.id, socket);

    // Setup connection-specific handlers
    this.setupConnectionHandlers(socket);

    // Join user-specific room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Send connection acknowledgment
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: Date.now(),
      serverInfo: {
        version: process.env.npm_package_version,
        features: ['compression', 'batching', 'persistence']
      }
    });
  }

  /**
   * Setup handlers for individual socket connections
   */
  private setupConnectionHandlers(socket: Socket): void {
    // Message handler with batching
    socket.on('message', (data) => this.handleMessage(socket, data));

    // Room management
    socket.on('join_room', (roomName) => this.handleJoinRoom(socket, roomName));
    socket.on('leave_room', (roomName) => this.handleLeaveRoom(socket, roomName));

    // Typing indicators with throttling
    socket.on('typing', this.throttle((data) => this.handleTyping(socket, data), 1000));

    // Presence management
    socket.on('presence_update', (status) => this.handlePresenceUpdate(socket, status));

    // Ping/pong for latency measurement
    socket.on('ping', (timestamp) => {
      socket.emit('pong', { timestamp, serverTime: Date.now() });
    });

    // Disconnection handler
    socket.on('disconnect', (reason) => this.handleDisconnection(socket, reason));

    // Error handler
    socket.on('error', (error) => {
      this.errorCount++;
      logger.error('Socket error', { socketId: socket.id, error });
    });
  }

  /**
   * Handle incoming messages with batching and optimization
   */
  private handleMessage(socket: Socket, data: unknown): void {
    try {
      const message: WebSocketMessage = {
        type: data.type || 'message',
        payload: data.payload || data,
        timestamp: Date.now(),
        userId: socket.data.userId,
        room: data.room
      };

      // Validate message
      if (!this.validateMessage(message)) {
        socket.emit('error', { message: 'Invalid message format' });
        return;
      }

      // Add to batch queue
      this.messageQueue.push(message);

      // Process batch if queue is full or setup timer
      if (this.messageQueue.length >= this.config.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.config.batchInterval);
      }

      // Track message count
      this.messageCount++;

      // Emit to appropriate handlers
      this.emit('message', message, socket);

    } catch (error) {
      this.errorCount++;
      logger.error('Message handling error', error);
      socket.emit('error', { message: 'Message processing failed' });
    }
  }

  /**
   * Process message batch for optimized delivery
   */
  private processBatch(): void {
    if (this.messageQueue.length === 0) return;

    const batch = this.messageQueue.splice(0, this.config.batchSize);

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Group messages by room for efficient delivery
    const roomMessages = new Map<string, WebSocketMessage[]>();

    for (const message of batch) {
      const room = message.room || 'global';
      if (!roomMessages.has(room)) {
        roomMessages.set(room, []);
      }
      roomMessages.get(room)!.push(message);
    }

    // Deliver messages to rooms
    for (const [room, messages] of roomMessages) {
      this.deliverToRoom(room, messages);
    }

    // Persist important messages
    this.persistMessages(batch);
  }

  /**
   * Deliver messages to a specific room
   */
  private deliverToRoom(room: string, messages: WebSocketMessage[]): void {
    try {
      // Get room configuration
      const config = this.roomConfigs.get(room) || {};

      // Compress large message batches if enabled
      if (config.compressionEnabled && messages.length > 10) {
        this.io.to(room).compress(true).emit('batch_messages', messages);
      } else {
        // Send individual messages for better real-time feel
        messages.forEach(message => {
          this.io.to(room).emit('message', message);
        });
      }

    } catch (error) {
      logger.error('Message delivery error', { room, error });
    }
  }

  /**
   * Handle room joining with optimization
   */
  private async handleJoinRoom(socket: Socket, roomName: string): Promise<void> {
    try {
      // Validate room name
      if (!this.validateRoomName(roomName)) {
        socket.emit('error', { message: 'Invalid room name' });
        return;
      }

      // Check room limits
      const roomSize = await this.getRoomSize(roomName);
      const roomConfig = this.roomConfigs.get(roomName) || {};

      if (roomConfig.maxConnections && roomSize >= roomConfig.maxConnections) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Join room
      await socket.join(roomName);

      logger.info('User joined room', {
        userId: socket.data.userId,
        roomName,
        roomSize: roomSize + 1
      });

      // Send room info
      socket.emit('room_joined', {
        room: roomName,
        memberCount: roomSize + 1,
        timestamp: Date.now()
      });

      // Notify room members
      socket.to(roomName).emit('user_joined', {
        userId: socket.data.userId,
        room: roomName,
        timestamp: Date.now()
      });

      // Send recent messages if configured
      if (roomConfig.persistMessages) {
        const recentMessages = await this.getRecentMessages(roomName, 50);
        socket.emit('recent_messages', recentMessages);
      }

    } catch (error) {
      logger.error('Join room error', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle room leaving
   */
  private handleLeaveRoom(socket: Socket, roomName: string): void {
    try {
      socket.leave(roomName);

      logger.info('User left room', {
        userId: socket.data.userId,
        roomName
      });

      // Notify room members
      socket.to(roomName).emit('user_left', {
        userId: socket.data.userId,
        room: roomName,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Leave room error', error);
    }
  }

  /**
   * Handle typing indicators with throttling
   */
  private handleTyping(socket: Socket, data: unknown): void {
    const room = data.room || 'global';

    socket.to(room).emit('typing', {
      userId: socket.data.userId,
      room,
      isTyping: data.isTyping,
      timestamp: Date.now()
    });
  }

  /**
   * Handle presence updates
   */
  private async handlePresenceUpdate(socket: Socket, status: string): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Update presence in cache
      await performanceCacheService.set(
        `presence:${userId}`,
        {
          status,
          lastSeen: Date.now(),
          socketId: socket.id
        },
        300 // 5 minutes TTL
      );

      // Broadcast to user's rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) { // Skip socket's own room
          socket.to(room).emit('presence_update', {
            userId,
            status,
            timestamp: Date.now()
          });
        }
      });

    } catch (error) {
      logger.error('Presence update error', error);
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    const userId = socket.data.userId;

    logger.info('WebSocket disconnection', {
      socketId: socket.id,
      userId,
      reason
    });

    // Update stats
    this.stats.totalConnections--;
    this.connectionPool.delete(socket.id);

    // Update presence
    if (userId) {
      performanceCacheService.set(
        `presence:${userId}`,
        {
          status: 'offline',
          lastSeen: Date.now(),
          socketId: null
        },
        3600 // 1 hour TTL for offline status
      );
    }

    // Notify rooms about disconnection
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user_disconnected', {
          userId,
          room,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Utility methods
   */
  private async verifyAuthToken(token: string): Promise<string | null> {
    try {
      // Implement your JWT verification logic here
      // For now, return a mock user ID
      return 'user_' + Math.random().toString(36).substr(2, 9);
    } catch (error) {
      return null;
    }
  }

  private validateMessage(message: WebSocketMessage): boolean {
    return !!(message.type && message.payload && message.timestamp);
  }

  private validateRoomName(roomName: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(roomName) && roomName.length <= 100;
  }

  private async getRoomSize(roomName: string): Promise<number> {
    try {
      const sockets = await this.io.in(roomName).fetchSockets();
      return sockets.length;
    } catch (error) {
      return 0;
    }
  }

  private async getRecentMessages(roomName: string, limit: number): Promise<WebSocketMessage[]> {
    try {
      const cacheKey = `room_messages:${roomName}`;
      const messages = await performanceCacheService.get(cacheKey) || [];
      return messages.slice(-limit);
    } catch (error) {
      logger.error('Failed to get recent messages', error);
      return [];
    }
  }

  private async persistMessages(messages: WebSocketMessage[]): Promise<void> {
    try {
      for (const message of messages) {
        if (message.room) {
          const cacheKey = `room_messages:${message.room}`;
          const existingMessages = await performanceCacheService.get(cacheKey) || [];

          existingMessages.push(message);

          // Keep only recent messages
          if (existingMessages.length > this.config.messageRetention) {
            existingMessages.splice(0, existingMessages.length - this.config.messageRetention);
          }

          await performanceCacheService.set(cacheKey, existingMessages, 3600); // 1 hour
        }
      }
    } catch (error) {
      logger.error('Message persistence error', error);
    }
  }

  private throttle(func: Function, delay: number): Function {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;

    return function (this: unknown, ...args: unknown[]) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Performance monitoring setup
   */
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceStats();
    }, 60000); // Update every minute
  }

  private updatePerformanceStats(): void {
    const now = Date.now();
    const timeDiff = now - this.lastStatsUpdate;

    // Update messages per second
    this.stats.messagesPerSecond = (this.messageCount * 1000) / timeDiff;

    // Update error rate
    this.stats.errorRate = (this.errorCount * 1000) / timeDiff;

    // Update average latency
    if (this.latencyMeasurements.length > 0) {
      this.stats.averageLatency = this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
      this.latencyMeasurements = [];
    }

    // Update room count
    this.stats.activeRooms = this.io.sockets.adapter.rooms.size;

    // Reset counters
    this.messageCount = 0;
    this.errorCount = 0;
    this.lastStatsUpdate = now;

    // Log stats in debug mode
    if (process.env.NODE_ENV === 'development') {
      logger.info('WebSocket Performance Stats', this.stats);
    }
  }

  /**
   * Public API methods
   */

  // Configure room settings
  public configureRoom(roomName: string, config: RoomConfig): void {
    this.roomConfigs.set(roomName, config);
  }

  // Broadcast to all connections
  public broadcast(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  // Send to specific user
  public sendToUser(userId: string, event: string, data: unknown): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Send to specific room
  public sendToRoom(roomName: string, event: string, data: unknown): void {
    this.io.to(roomName).emit(event, data);
  }

  // Get connection statistics
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  // Get connected user count
  public getConnectedUserCount(): number {
    return this.connectionPool.size;
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service');

    // Process remaining messages
    if (this.messageQueue.length > 0) {
      this.processBatch();
    }

    // Close all connections
    this.io.close();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    logger.info('WebSocket service shutdown complete');
  }
}

export default OptimizedWebSocketService;