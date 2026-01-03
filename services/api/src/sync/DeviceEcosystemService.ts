import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import sodium from 'libsodium-wrappers';
import crypto from 'crypto';
import dgram from 'dgram';
import { promisify } from 'util';

interface Device {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web' | 'desktop' | 'watch' | 'tv';
  osVersion: string;
  appVersion: string;
  userId: string;
  publicKey: string;
  capabilities: DeviceCapability[];
  lastSeen: number;
  online: boolean;
  batteryLevel?: number;
  networkType?: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth';
}

interface DeviceCapability {
  type: string;
  enabled: boolean;
  version?: string;
}

interface DevicePairing {
  id: string;
  deviceId1: string;
  deviceId2: string;
  sharedSecret: Buffer;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
}

interface HandoffContext {
  activityType: string;
  activityId: string;
  state: any;
  sourceDevice: string;
  targetDevice?: string;
  timestamp: number;
  userInfo: Record<string, any>;
}

interface ClipboardEntry {
  id: string;
  userId: string;
  deviceId: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'url';
  encrypted: boolean;
  timestamp: number;
  expiresAt: number;
}

interface DevicePresence {
  deviceId: string;
  online: boolean;
  lastSeen: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  activity?: string;
}

interface DeviceGroup {
  id: string;
  name: string;
  type: 'family' | 'team' | 'personal';
  ownerId: string;
  devices: string[];
  permissions: GroupPermission[];
  createdAt: number;
}

interface GroupPermission {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  capabilities: string[];
}

interface NotificationRoute {
  id: string;
  userId: string;
  rules: NotificationRule[];
  priority: number;
}

interface NotificationRule {
  condition: string;
  targetDevices: string[];
  delay: number;
  deduplicate: boolean;
}

interface MDNSService {
  name: string;
  type: string;
  port: number;
  host: string;
  addresses: string[];
  txt: Record<string, string>;
}

interface WebRTCPeer {
  deviceId: string;
  connection: any;
  dataChannel: any;
  isInitiator: boolean;
}

interface QRCodePairing {
  code: string;
  deviceId: string;
  publicKey: string;
  expiresAt: number;
  used: boolean;
}

export class DeviceEcosystemService extends EventEmitter {
  private prisma: PrismaClient;
  private redis: Redis;
  private devices: Map<string, Device>;
  private pairings: Map<string, DevicePairing>;
  private handoffContexts: Map<string, HandoffContext>;
  private clipboardEntries: Map<string, ClipboardEntry>;
  private presence: Map<string, DevicePresence>;
  private deviceGroups: Map<string, DeviceGroup>;
  private notificationRoutes: Map<string, NotificationRoute>;
  private mdnsSocket: dgram.Socket;
  private webrtcPeers: Map<string, WebRTCPeer>;
  private qrCodePairings: Map<string, QRCodePairing>;
  private discoveryInterval: number;
  private presenceInterval: number;
  private clipboardTTL: number;

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.devices = new Map();
    this.pairings = new Map();
    this.handoffContexts = new Map();
    this.clipboardEntries = new Map();
    this.presence = new Map();
    this.deviceGroups = new Map();
    this.notificationRoutes = new Map();
    this.webrtcPeers = new Map();
    this.qrCodePairings = new Map();
    this.mdnsSocket = dgram.createSocket('udp4');
    this.discoveryInterval = 30000;
    this.presenceInterval = 10000;
    this.clipboardTTL = 3600000;

    this.initializeSodium();
    this.initializeMDNS();
    this.startPresenceMonitoring();
    this.startClipboardCleanup();
  }

  private async initializeSodium(): Promise<void> {
    await sodium.ready;
  }

  private initializeMDNS(): void {
    this.mdnsSocket.on('message', async (msg, rinfo) => {
      try {
        await this.handleMDNSMessage(msg, rinfo);
      } catch (error) {
        console.error('mDNS message handling error:', error);
      }
    });

    this.mdnsSocket.on('error', (error) => {
      console.error('mDNS socket error:', error);
    });

    this.mdnsSocket.bind(5353, () => {
      this.mdnsSocket.addMembership('224.0.0.251');
      this.startDeviceDiscovery();
    });
  }

  private async handleMDNSMessage(msg: Buffer, rinfo: dgram.RemoteInfo): Promise<void> {
    try {
      const service = this.parseMDNSMessage(msg);

      if (service && service.type === '_upcoach._tcp.local') {
        const deviceId = service.txt.deviceId;
        const publicKey = service.txt.publicKey;

        if (deviceId && publicKey) {
          await this.registerDiscoveredDevice({
            id: deviceId,
            name: service.txt.name || 'Unknown Device',
            platform: service.txt.platform as any || 'web',
            osVersion: service.txt.osVersion || 'unknown',
            appVersion: service.txt.appVersion || 'unknown',
            userId: service.txt.userId || '',
            publicKey,
            capabilities: JSON.parse(service.txt.capabilities || '[]'),
            lastSeen: Date.now(),
            online: true,
          });

          this.emit('device:discovered', { deviceId, address: rinfo.address });
        }
      }
    } catch (error) {
      console.error('mDNS parsing error:', error);
    }
  }

  private parseMDNSMessage(msg: Buffer): MDNSService | null {
    try {
      let offset = 0;
      const transactionId = msg.readUInt16BE(offset);
      offset += 2;

      const flags = msg.readUInt16BE(offset);
      offset += 2;

      const questions = msg.readUInt16BE(offset);
      offset += 2;

      const answerRRs = msg.readUInt16BE(offset);
      offset += 2;

      offset += 4;

      for (let i = 0; i < questions; i++) {
        const { name, offset: newOffset } = this.readDomainName(msg, offset);
        offset = newOffset;
        offset += 4;
      }

      for (let i = 0; i < answerRRs; i++) {
        const { name, offset: nameOffset } = this.readDomainName(msg, offset);
        offset = nameOffset;

        const type = msg.readUInt16BE(offset);
        offset += 2;

        const classCode = msg.readUInt16BE(offset);
        offset += 2;

        const ttl = msg.readUInt32BE(offset);
        offset += 4;

        const dataLength = msg.readUInt16BE(offset);
        offset += 2;

        const data = msg.slice(offset, offset + dataLength);
        offset += dataLength;

        if (type === 16) {
          const txt = this.parseTXT(data);

          return {
            name,
            type: name,
            port: 0,
            host: '',
            addresses: [],
            txt,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private readDomainName(
    buffer: Buffer,
    offset: number
  ): { name: string; offset: number } {
    const parts: string[] = [];
    let jumped = false;
    let jumpOffset = 0;

    while (true) {
      if (offset >= buffer.length) break;

      const length = buffer.readUInt8(offset);

      if (length === 0) {
        offset++;
        break;
      }

      if ((length & 0xc0) === 0xc0) {
        if (!jumped) {
          jumpOffset = offset + 2;
        }

        const pointer = ((length & 0x3f) << 8) | buffer.readUInt8(offset + 1);
        offset = pointer;
        jumped = true;
        continue;
      }

      offset++;
      const part = buffer.toString('utf8', offset, offset + length);
      parts.push(part);
      offset += length;
    }

    return {
      name: parts.join('.'),
      offset: jumped ? jumpOffset : offset,
    };
  }

  private parseTXT(data: Buffer): Record<string, string> {
    const result: Record<string, string> = {};
    let offset = 0;

    while (offset < data.length) {
      const length = data.readUInt8(offset);
      offset++;

      if (length === 0) break;

      const text = data.toString('utf8', offset, offset + length);
      offset += length;

      const [key, value] = text.split('=');
      if (key) {
        result[key] = value || '';
      }
    }

    return result;
  }

  private startDeviceDiscovery(): void {
    setInterval(() => {
      this.broadcastMDNSQuery();
    }, this.discoveryInterval);

    this.broadcastMDNSQuery();
  }

  private broadcastMDNSQuery(): void {
    const query = this.buildMDNSQuery('_upcoach._tcp.local');
    this.mdnsSocket.send(query, 5353, '224.0.0.251');
  }

  private buildMDNSQuery(serviceName: string): Buffer {
    const buffer = Buffer.alloc(512);
    let offset = 0;

    buffer.writeUInt16BE(0, offset);
    offset += 2;

    buffer.writeUInt16BE(0, offset);
    offset += 2;

    buffer.writeUInt16BE(1, offset);
    offset += 2;

    buffer.writeUInt16BE(0, offset);
    offset += 2;

    buffer.writeUInt16BE(0, offset);
    offset += 2;

    buffer.writeUInt16BE(0, offset);
    offset += 2;

    const parts = serviceName.split('.');
    for (const part of parts) {
      buffer.writeUInt8(part.length, offset);
      offset++;
      buffer.write(part, offset);
      offset += part.length;
    }

    buffer.writeUInt8(0, offset);
    offset++;

    buffer.writeUInt16BE(12, offset);
    offset += 2;

    buffer.writeUInt16BE(1, offset);
    offset += 2;

    return buffer.slice(0, offset);
  }

  public async registerDevice(device: Device): Promise<void> {
    try {
      await sodium.ready;

      this.devices.set(device.id, device);

      await this.prisma.$executeRaw`
        INSERT INTO devices (
          id, name, platform, os_version, app_version, user_id,
          public_key, capabilities, last_seen, online
        ) VALUES (
          ${device.id}, ${device.name}, ${device.platform},
          ${device.osVersion}, ${device.appVersion}, ${device.userId},
          ${device.publicKey}, ${JSON.stringify(device.capabilities)},
          ${new Date(device.lastSeen)}, ${device.online}
        )
        ON CONFLICT (id) DO UPDATE SET
          last_seen = EXCLUDED.last_seen,
          online = EXCLUDED.online,
          app_version = EXCLUDED.app_version
      `;

      await this.redis.setex(
        `device:${device.id}`,
        3600,
        JSON.stringify(device)
      );

      this.updatePresence(device.id, true);

      this.emit('device:registered', device);
    } catch (error) {
      throw new Error(`Device registration failed: ${(error as Error).message}`);
    }
  }

  private async registerDiscoveredDevice(device: Device): Promise<void> {
    if (!this.devices.has(device.id)) {
      await this.registerDevice(device);
      this.emit('device:discovered', device);
    } else {
      this.updatePresence(device.id, true);
    }
  }

  public async pairDevices(
    deviceId1: string,
    deviceId2: string,
    method: 'ecdh' | 'qr'
  ): Promise<DevicePairing> {
    try {
      await sodium.ready;

      const device1 = this.devices.get(deviceId1);
      const device2 = this.devices.get(deviceId2);

      if (!device1 || !device2) {
        throw new Error('One or both devices not found');
      }

      let sharedSecret: Buffer;

      if (method === 'ecdh') {
        sharedSecret = await this.performECDH(device1, device2);
      } else {
        sharedSecret = await this.performQRPairing(device1, device2);
      }

      const pairing: DevicePairing = {
        id: crypto.randomUUID(),
        deviceId1,
        deviceId2,
        sharedSecret,
        createdAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        verified: true,
      };

      this.pairings.set(pairing.id, pairing);

      await this.prisma.$executeRaw`
        INSERT INTO device_pairings (
          id, device_id_1, device_id_2, shared_secret,
          created_at, expires_at, verified
        ) VALUES (
          ${pairing.id}, ${deviceId1}, ${deviceId2},
          ${sharedSecret}, ${new Date(pairing.createdAt)},
          ${new Date(pairing.expiresAt)}, ${pairing.verified}
        )
      `;

      await this.redis.setex(
        `pairing:${deviceId1}:${deviceId2}`,
        86400,
        pairing.id
      );

      this.emit('devices:paired', pairing);

      return pairing;
    } catch (error) {
      throw new Error(`Device pairing failed: ${(error as Error).message}`);
    }
  }

  private async performECDH(device1: Device, device2: Device): Promise<Buffer> {
    await sodium.ready;

    const keypair1 = sodium.crypto_kx_keypair();
    const keypair2 = sodium.crypto_kx_keypair();

    const clientKeys = sodium.crypto_kx_client_session_keys(
      keypair1.publicKey,
      keypair1.privateKey,
      keypair2.publicKey
    );

    return Buffer.from(clientKeys.sharedRx);
  }

  private async performQRPairing(device1: Device, device2: Device): Promise<Buffer> {
    await sodium.ready;

    const secret = sodium.randombytes_buf(32);
    return Buffer.from(secret);
  }

  public async generateQRCode(deviceId: string): Promise<string> {
    try {
      await sodium.ready;

      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const secret = sodium.randombytes_buf(32);
      const code = Buffer.from(secret).toString('base64');

      const qrPairing: QRCodePairing = {
        code,
        deviceId,
        publicKey: device.publicKey,
        expiresAt: Date.now() + 300000,
        used: false,
      };

      this.qrCodePairings.set(code, qrPairing);

      setTimeout(() => {
        this.qrCodePairings.delete(code);
      }, 300000);

      return code;
    } catch (error) {
      throw new Error(`QR code generation failed: ${(error as Error).message}`);
    }
  }

  public async scanQRCode(deviceId: string, code: string): Promise<DevicePairing> {
    try {
      const qrPairing = this.qrCodePairings.get(code);

      if (!qrPairing) {
        throw new Error('Invalid or expired QR code');
      }

      if (qrPairing.used) {
        throw new Error('QR code already used');
      }

      if (qrPairing.expiresAt < Date.now()) {
        throw new Error('QR code expired');
      }

      qrPairing.used = true;

      const pairing = await this.pairDevices(
        qrPairing.deviceId,
        deviceId,
        'qr'
      );

      this.qrCodePairings.delete(code);

      return pairing;
    } catch (error) {
      throw new Error(`QR code scan failed: ${(error as Error).message}`);
    }
  }

  public async initiateHandoff(context: HandoffContext): Promise<void> {
    try {
      this.handoffContexts.set(context.activityId, context);

      await this.redis.setex(
        `handoff:${context.activityId}`,
        300,
        JSON.stringify(context)
      );

      if (context.targetDevice) {
        await this.notifyDevice(context.targetDevice, {
          type: 'handoff:available',
          context,
        });
      } else {
        const userId = this.devices.get(context.sourceDevice)?.userId;
        if (userId) {
          const userDevices = Array.from(this.devices.values())
            .filter((d) => d.userId === userId && d.id !== context.sourceDevice);

          for (const device of userDevices) {
            await this.notifyDevice(device.id, {
              type: 'handoff:available',
              context,
            });
          }
        }
      }

      this.emit('handoff:initiated', context);
    } catch (error) {
      throw new Error(`Handoff initiation failed: ${(error as Error).message}`);
    }
  }

  public async acceptHandoff(
    activityId: string,
    targetDevice: string
  ): Promise<HandoffContext> {
    try {
      let context = this.handoffContexts.get(activityId);

      if (!context) {
        const cached = await this.redis.get(`handoff:${activityId}`);
        if (cached) {
          context = JSON.parse(cached);
        }
      }

      if (!context) {
        throw new Error('Handoff context not found');
      }

      context.targetDevice = targetDevice;

      await this.notifyDevice(context.sourceDevice, {
        type: 'handoff:accepted',
        targetDevice,
      });

      this.handoffContexts.delete(activityId);
      await this.redis.del(`handoff:${activityId}`);

      this.emit('handoff:accepted', { activityId, targetDevice });

      return context;
    } catch (error) {
      throw new Error(`Handoff acceptance failed: ${(error as Error).message}`);
    }
  }

  public async syncClipboard(
    userId: string,
    deviceId: string,
    content: string,
    contentType: ClipboardEntry['contentType']
  ): Promise<ClipboardEntry> {
    try {
      await sodium.ready;

      const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
      const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);

      const encrypted = sodium.crypto_secretbox_easy(
        content,
        nonce,
        key
      );

      const encryptedContent = Buffer.concat([
        Buffer.from(nonce),
        Buffer.from(encrypted),
      ]).toString('base64');

      const entry: ClipboardEntry = {
        id: crypto.randomUUID(),
        userId,
        deviceId,
        content: encryptedContent,
        contentType,
        encrypted: true,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.clipboardTTL,
      };

      this.clipboardEntries.set(entry.id, entry);

      await this.redis.setex(
        `clipboard:${userId}`,
        Math.floor(this.clipboardTTL / 1000),
        JSON.stringify({ ...entry, key: Buffer.from(key).toString('base64') })
      );

      const userDevices = Array.from(this.devices.values())
        .filter((d) => d.userId === userId && d.id !== deviceId);

      for (const device of userDevices) {
        await this.notifyDevice(device.id, {
          type: 'clipboard:updated',
          entry: { ...entry, key: Buffer.from(key).toString('base64') },
        });
      }

      this.emit('clipboard:synced', entry);

      return entry;
    } catch (error) {
      throw new Error(`Clipboard sync failed: ${(error as Error).message}`);
    }
  }

  public async getClipboard(userId: string, key: string): Promise<string> {
    try {
      await sodium.ready;

      const cached = await this.redis.get(`clipboard:${userId}`);
      if (!cached) {
        throw new Error('Clipboard not found');
      }

      const data = JSON.parse(cached);
      const encryptedBuffer = Buffer.from(data.content, 'base64');
      const nonce = encryptedBuffer.slice(0, sodium.crypto_secretbox_NONCEBYTES);
      const ciphertext = encryptedBuffer.slice(sodium.crypto_secretbox_NONCEBYTES);
      const keyBuffer = Buffer.from(key, 'base64');

      const decrypted = sodium.crypto_secretbox_open_easy(
        ciphertext,
        nonce,
        keyBuffer
      );

      return Buffer.from(decrypted).toString();
    } catch (error) {
      throw new Error(`Clipboard retrieval failed: ${(error as Error).message}`);
    }
  }

  private startPresenceMonitoring(): void {
    setInterval(async () => {
      await this.updateAllPresence();
    }, this.presenceInterval);
  }

  private async updateAllPresence(): Promise<void> {
    const now = Date.now();

    for (const [deviceId, device] of this.devices) {
      const offline = now - device.lastSeen > this.presenceInterval * 3;

      if (device.online && offline) {
        this.updatePresence(deviceId, false);
      }
    }
  }

  private updatePresence(deviceId: string, online: boolean): void {
    const presence: DevicePresence = {
      deviceId,
      online,
      lastSeen: Date.now(),
    };

    this.presence.set(deviceId, presence);

    const device = this.devices.get(deviceId);
    if (device) {
      device.online = online;
      device.lastSeen = presence.lastSeen;
      this.devices.set(deviceId, device);
    }

    this.redis.setex(
      `presence:${deviceId}`,
      60,
      JSON.stringify(presence)
    );

    this.emit('presence:updated', presence);
  }

  public async detectCapabilities(deviceId: string): Promise<DeviceCapability[]> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const capabilities: DeviceCapability[] = [
        { type: 'clipboard', enabled: true },
        { type: 'handoff', enabled: true },
        { type: 'notifications', enabled: true },
      ];

      if (device.platform === 'ios' || device.platform === 'android') {
        capabilities.push(
          { type: 'location', enabled: true },
          { type: 'camera', enabled: true },
          { type: 'bluetooth', enabled: true }
        );
      }

      if (device.platform === 'web' || device.platform === 'desktop') {
        capabilities.push(
          { type: 'filesystem', enabled: true },
          { type: 'webrtc', enabled: true }
        );
      }

      device.capabilities = capabilities;
      this.devices.set(deviceId, device);

      await this.prisma.$executeRaw`
        UPDATE devices
        SET capabilities = ${JSON.stringify(capabilities)}
        WHERE id = ${deviceId}
      `;

      return capabilities;
    } catch (error) {
      throw new Error(`Capability detection failed: ${(error as Error).message}`);
    }
  }

  public async createDeviceGroup(group: DeviceGroup): Promise<void> {
    try {
      this.deviceGroups.set(group.id, group);

      await this.prisma.$executeRaw`
        INSERT INTO device_groups (
          id, name, type, owner_id, devices, permissions, created_at
        ) VALUES (
          ${group.id}, ${group.name}, ${group.type}, ${group.ownerId},
          ${JSON.stringify(group.devices)},
          ${JSON.stringify(group.permissions)},
          ${new Date(group.createdAt)}
        )
      `;

      this.emit('group:created', group);
    } catch (error) {
      throw new Error(`Group creation failed: ${(error as Error).message}`);
    }
  }

  public async addDeviceToGroup(groupId: string, deviceId: string): Promise<void> {
    try {
      const group = this.deviceGroups.get(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.devices.includes(deviceId)) {
        group.devices.push(deviceId);
        this.deviceGroups.set(groupId, group);

        await this.prisma.$executeRaw`
          UPDATE device_groups
          SET devices = ${JSON.stringify(group.devices)}
          WHERE id = ${groupId}
        `;

        this.emit('group:device-added', { groupId, deviceId });
      }
    } catch (error) {
      throw new Error(`Add device to group failed: ${(error as Error).message}`);
    }
  }

  public async removeDeviceFromGroup(groupId: string, deviceId: string): Promise<void> {
    try {
      const group = this.deviceGroups.get(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      group.devices = group.devices.filter((id) => id !== deviceId);
      this.deviceGroups.set(groupId, group);

      await this.prisma.$executeRaw`
        UPDATE device_groups
        SET devices = ${JSON.stringify(group.devices)}
        WHERE id = ${groupId}
      `;

      this.emit('group:device-removed', { groupId, deviceId });
    } catch (error) {
      throw new Error(`Remove device from group failed: ${(error as Error).message}`);
    }
  }

  public async routeNotification(
    userId: string,
    notification: any
  ): Promise<string[]> {
    try {
      const routes = Array.from(this.notificationRoutes.values())
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.priority - a.priority);

      const targetDevices: Set<string> = new Set();

      for (const route of routes) {
        for (const rule of route.rules) {
          if (this.evaluateCondition(rule.condition, notification)) {
            for (const deviceId of rule.targetDevices) {
              if (!rule.deduplicate || !targetDevices.has(deviceId)) {
                targetDevices.add(deviceId);

                if (rule.delay > 0) {
                  setTimeout(async () => {
                    await this.notifyDevice(deviceId, notification);
                  }, rule.delay);
                } else {
                  await this.notifyDevice(deviceId, notification);
                }
              }
            }
          }
        }
      }

      return Array.from(targetDevices);
    } catch (error) {
      throw new Error(`Notification routing failed: ${(error as Error).message}`);
    }
  }

  private evaluateCondition(condition: string, notification: any): boolean {
    try {
      const func = new Function('notification', `return ${condition}`);
      return func(notification);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  private async notifyDevice(deviceId: string, data: any): Promise<void> {
    try {
      await this.redis.publish(
        `device:${deviceId}:notifications`,
        JSON.stringify(data)
      );

      this.emit('notification:sent', { deviceId, data });
    } catch (error) {
      console.error('Device notification error:', error);
    }
  }

  public async createWebRTCConnection(
    deviceId1: string,
    deviceId2: string,
    isInitiator: boolean
  ): Promise<void> {
    try {
      const signaling = {
        type: 'webrtc:offer',
        from: deviceId1,
        to: deviceId2,
        isInitiator,
      };

      await this.redis.publish(
        `device:${deviceId2}:signaling`,
        JSON.stringify(signaling)
      );

      this.emit('webrtc:connection-initiated', { deviceId1, deviceId2 });
    } catch (error) {
      throw new Error(`WebRTC connection failed: ${(error as Error).message}`);
    }
  }

  private startClipboardCleanup(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [id, entry] of this.clipboardEntries) {
        if (entry.expiresAt < now) {
          this.clipboardEntries.delete(id);
        }
      }
    }, 60000);
  }

  public async unpairDevices(pairingId: string): Promise<void> {
    try {
      const pairing = this.pairings.get(pairingId);
      if (!pairing) {
        throw new Error('Pairing not found');
      }

      this.pairings.delete(pairingId);

      await this.prisma.$executeRaw`
        DELETE FROM device_pairings
        WHERE id = ${pairingId}
      `;

      await this.redis.del(`pairing:${pairing.deviceId1}:${pairing.deviceId2}`);

      this.emit('devices:unpaired', pairing);
    } catch (error) {
      throw new Error(`Unpairing failed: ${(error as Error).message}`);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      this.mdnsSocket.close();
      await this.redis.quit();
      await this.prisma.$disconnect();

      this.emit('shutdown');
    } catch (error) {
      console.error('Shutdown error:', error);
      throw error;
    }
  }
}
