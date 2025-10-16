"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedWebSocketService = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const logger_1 = require("../../utils/logger");
const PerformanceCacheService_1 = require("../cache/PerformanceCacheService");
const events_1 = require("events");
class OptimizedWebSocketService extends events_1.EventEmitter {
    io;
    redis;
    connectionPool = new Map();
    roomConfigs = new Map();
    messageQueue = [];
    batchTimer = null;
    stats = {
        totalConnections: 0,
        activeRooms: 0,
        messagesPerSecond: 0,
        averageLatency: 0,
        errorRate: 0
    };
    messageCount = 0;
    errorCount = 0;
    latencyMeasurements = [];
    lastStatsUpdate = Date.now();
    config = {
        batchSize: 100,
        batchInterval: 50,
        maxMessageRate: 100,
        heartbeatInterval: 25000,
        heartbeatTimeout: 60000,
        maxConnections: 10000,
        compressionThreshold: 1024,
        messageRetention: 1000,
        rateLimitWindow: 60000,
        maxRoomsPerConnection: 50
    };
    constructor(httpServer) {
        super();
        this.initializeSocketIO(httpServer);
        this.setupRedisAdapter();
        this.setupPerformanceMonitoring();
    }
    initializeSocketIO(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            pingTimeout: this.config.heartbeatTimeout,
            pingInterval: this.config.heartbeatInterval,
            upgradeTimeout: 30000,
            maxHttpBufferSize: 1e6,
            allowEIO3: true,
            compression: true,
            httpCompression: {
                threshold: this.config.compressionThreshold,
                chunkSize: 1024,
                windowBits: 13,
                concurrency: 10
            },
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            allowUpgrades: true,
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000,
                skipMiddlewares: true
            }
        });
        this.setupSocketHandlers();
    }
    async setupRedisAdapter() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            const pubClient = (0, redis_1.createClient)({ url: redisUrl });
            const subClient = pubClient.duplicate();
            await Promise.all([
                pubClient.connect(),
                subClient.connect()
            ]);
            this.io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
            this.redis = pubClient;
            logger_1.logger.info('Redis adapter configured for WebSocket service');
        }
        catch (error) {
            logger_1.logger.error('Failed to setup Redis adapter', error);
        }
    }
    setupSocketHandlers() {
        this.io.use(this.authenticationMiddleware.bind(this));
        this.io.use(this.rateLimitMiddleware.bind(this));
        this.io.on('connection', this.handleConnection.bind(this));
        this.io.engine.on('connection_error', (err) => {
            this.errorCount++;
            logger_1.logger.error('WebSocket connection error', err);
        });
    }
    async authenticationMiddleware(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const userId = await this.verifyAuthToken(token);
            if (!userId) {
                return next(new Error('Invalid authentication token'));
            }
            socket.data.userId = userId;
            socket.data.authenticatedAt = Date.now();
            next();
        }
        catch (error) {
            logger_1.logger.error('WebSocket authentication error', error);
            next(new Error('Authentication failed'));
        }
    }
    rateLimitMiddleware(socket, next) {
        const clientIp = socket.handshake.address;
        const rateLimitKey = `ws_rate_limit:${clientIp}`;
        PerformanceCacheService_1.performanceCacheService.increment(rateLimitKey, 1, this.config.rateLimitWindow / 1000)
            .then(count => {
            if (count > this.config.maxMessageRate) {
                return next(new Error('Rate limit exceeded'));
            }
            next();
        })
            .catch(error => {
            logger_1.logger.error('Rate limit check failed', error);
            next();
        });
    }
    handleConnection(socket) {
        const userId = socket.data.userId;
        logger_1.logger.info('WebSocket connection established', {
            socketId: socket.id,
            userId,
            clientIp: socket.handshake.address
        });
        this.stats.totalConnections++;
        this.connectionPool.set(socket.id, socket);
        this.setupConnectionHandlers(socket);
        if (userId) {
            socket.join(`user:${userId}`);
        }
        socket.emit('connected', {
            socketId: socket.id,
            timestamp: Date.now(),
            serverInfo: {
                version: process.env.npm_package_version,
                features: ['compression', 'batching', 'persistence']
            }
        });
    }
    setupConnectionHandlers(socket) {
        socket.on('message', (data) => this.handleMessage(socket, data));
        socket.on('join_room', (roomName) => this.handleJoinRoom(socket, roomName));
        socket.on('leave_room', (roomName) => this.handleLeaveRoom(socket, roomName));
        socket.on('typing', this.throttle((data) => this.handleTyping(socket, data), 1000));
        socket.on('presence_update', (status) => this.handlePresenceUpdate(socket, status));
        socket.on('ping', (timestamp) => {
            socket.emit('pong', { timestamp, serverTime: Date.now() });
        });
        socket.on('disconnect', (reason) => this.handleDisconnection(socket, reason));
        socket.on('error', (error) => {
            this.errorCount++;
            logger_1.logger.error('Socket error', { socketId: socket.id, error });
        });
    }
    handleMessage(socket, data) {
        try {
            const message = {
                type: data.type || 'message',
                payload: data.payload || data,
                timestamp: Date.now(),
                userId: socket.data.userId,
                room: data.room
            };
            if (!this.validateMessage(message)) {
                socket.emit('error', { message: 'Invalid message format' });
                return;
            }
            this.messageQueue.push(message);
            if (this.messageQueue.length >= this.config.batchSize) {
                this.processBatch();
            }
            else if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => this.processBatch(), this.config.batchInterval);
            }
            this.messageCount++;
            this.emit('message', message, socket);
        }
        catch (error) {
            this.errorCount++;
            logger_1.logger.error('Message handling error', error);
            socket.emit('error', { message: 'Message processing failed' });
        }
    }
    processBatch() {
        if (this.messageQueue.length === 0)
            return;
        const batch = this.messageQueue.splice(0, this.config.batchSize);
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        const roomMessages = new Map();
        for (const message of batch) {
            const room = message.room || 'global';
            if (!roomMessages.has(room)) {
                roomMessages.set(room, []);
            }
            roomMessages.get(room).push(message);
        }
        for (const [room, messages] of roomMessages) {
            this.deliverToRoom(room, messages);
        }
        this.persistMessages(batch);
    }
    deliverToRoom(room, messages) {
        try {
            const config = this.roomConfigs.get(room) || {};
            if (config.compressionEnabled && messages.length > 10) {
                this.io.to(room).compress(true).emit('batch_messages', messages);
            }
            else {
                messages.forEach(message => {
                    this.io.to(room).emit('message', message);
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Message delivery error', { room, error });
        }
    }
    async handleJoinRoom(socket, roomName) {
        try {
            if (!this.validateRoomName(roomName)) {
                socket.emit('error', { message: 'Invalid room name' });
                return;
            }
            const roomSize = await this.getRoomSize(roomName);
            const roomConfig = this.roomConfigs.get(roomName) || {};
            if (roomConfig.maxConnections && roomSize >= roomConfig.maxConnections) {
                socket.emit('error', { message: 'Room is full' });
                return;
            }
            await socket.join(roomName);
            logger_1.logger.info('User joined room', {
                userId: socket.data.userId,
                roomName,
                roomSize: roomSize + 1
            });
            socket.emit('room_joined', {
                room: roomName,
                memberCount: roomSize + 1,
                timestamp: Date.now()
            });
            socket.to(roomName).emit('user_joined', {
                userId: socket.data.userId,
                room: roomName,
                timestamp: Date.now()
            });
            if (roomConfig.persistMessages) {
                const recentMessages = await this.getRecentMessages(roomName, 50);
                socket.emit('recent_messages', recentMessages);
            }
        }
        catch (error) {
            logger_1.logger.error('Join room error', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    }
    handleLeaveRoom(socket, roomName) {
        try {
            socket.leave(roomName);
            logger_1.logger.info('User left room', {
                userId: socket.data.userId,
                roomName
            });
            socket.to(roomName).emit('user_left', {
                userId: socket.data.userId,
                room: roomName,
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Leave room error', error);
        }
    }
    handleTyping(socket, data) {
        const room = data.room || 'global';
        socket.to(room).emit('typing', {
            userId: socket.data.userId,
            room,
            isTyping: data.isTyping,
            timestamp: Date.now()
        });
    }
    async handlePresenceUpdate(socket, status) {
        try {
            const userId = socket.data.userId;
            await PerformanceCacheService_1.performanceCacheService.set(`presence:${userId}`, {
                status,
                lastSeen: Date.now(),
                socketId: socket.id
            }, 300);
            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                if (room !== socket.id) {
                    socket.to(room).emit('presence_update', {
                        userId,
                        status,
                        timestamp: Date.now()
                    });
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Presence update error', error);
        }
    }
    handleDisconnection(socket, reason) {
        const userId = socket.data.userId;
        logger_1.logger.info('WebSocket disconnection', {
            socketId: socket.id,
            userId,
            reason
        });
        this.stats.totalConnections--;
        this.connectionPool.delete(socket.id);
        if (userId) {
            PerformanceCacheService_1.performanceCacheService.set(`presence:${userId}`, {
                status: 'offline',
                lastSeen: Date.now(),
                socketId: null
            }, 3600);
        }
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
    async verifyAuthToken(token) {
        try {
            return 'user_' + Math.random().toString(36).substr(2, 9);
        }
        catch (error) {
            return null;
        }
    }
    validateMessage(message) {
        return !!(message.type && message.payload && message.timestamp);
    }
    validateRoomName(roomName) {
        return /^[a-zA-Z0-9_-]+$/.test(roomName) && roomName.length <= 100;
    }
    async getRoomSize(roomName) {
        try {
            const sockets = await this.io.in(roomName).fetchSockets();
            return sockets.length;
        }
        catch (error) {
            return 0;
        }
    }
    async getRecentMessages(roomName, limit) {
        try {
            const cacheKey = `room_messages:${roomName}`;
            const messages = await PerformanceCacheService_1.performanceCacheService.get(cacheKey) || [];
            return messages.slice(-limit);
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent messages', error);
            return [];
        }
    }
    async persistMessages(messages) {
        try {
            for (const message of messages) {
                if (message.room) {
                    const cacheKey = `room_messages:${message.room}`;
                    const existingMessages = await PerformanceCacheService_1.performanceCacheService.get(cacheKey) || [];
                    existingMessages.push(message);
                    if (existingMessages.length > this.config.messageRetention) {
                        existingMessages.splice(0, existingMessages.length - this.config.messageRetention);
                    }
                    await PerformanceCacheService_1.performanceCacheService.set(cacheKey, existingMessages, 3600);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Message persistence error', error);
        }
    }
    throttle(func, delay) {
        let timeoutId = null;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            }
            else {
                if (timeoutId)
                    clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
    setupPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceStats();
        }, 60000);
    }
    updatePerformanceStats() {
        const now = Date.now();
        const timeDiff = now - this.lastStatsUpdate;
        this.stats.messagesPerSecond = (this.messageCount * 1000) / timeDiff;
        this.stats.errorRate = (this.errorCount * 1000) / timeDiff;
        if (this.latencyMeasurements.length > 0) {
            this.stats.averageLatency = this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
            this.latencyMeasurements = [];
        }
        this.stats.activeRooms = this.io.sockets.adapter.rooms.size;
        this.messageCount = 0;
        this.errorCount = 0;
        this.lastStatsUpdate = now;
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.info('WebSocket Performance Stats', this.stats);
        }
    }
    configureRoom(roomName, config) {
        this.roomConfigs.set(roomName, config);
    }
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    sendToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }
    sendToRoom(roomName, event, data) {
        this.io.to(roomName).emit(event, data);
    }
    getStats() {
        return { ...this.stats };
    }
    getConnectedUserCount() {
        return this.connectionPool.size;
    }
    async shutdown() {
        logger_1.logger.info('Shutting down WebSocket service');
        if (this.messageQueue.length > 0) {
            this.processBatch();
        }
        this.io.close();
        if (this.redis) {
            await this.redis.quit();
        }
        logger_1.logger.info('WebSocket service shutdown complete');
    }
}
exports.OptimizedWebSocketService = OptimizedWebSocketService;
exports.default = OptimizedWebSocketService;
