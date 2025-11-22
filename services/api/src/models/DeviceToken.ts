/**
 * Device Token Model
 * Stores FCM device tokens for push notifications
 *
 * Note: In production, this should be a Prisma model.
 * For now, this is a TypeScript interface for type safety.
 *
 * To create the Prisma model, add to schema.prisma:
 *
 * model DeviceToken {
 *   id          String   @id @default(uuid())
 *   userId      String
 *   user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
 *   token       String   @unique
 *   platform    Platform
 *   deviceId    String
 *   deviceName  String?
 *   appVersion  String?
 *   osVersion   String?
 *   isActive    Boolean  @default(true)
 *   lastUsedAt  DateTime @default(now())
 *   createdAt   DateTime @default(now())
 *   updatedAt   DateTime @updatedAt
 *
 *   @@index([userId])
 *   @@index([token])
 *   @@index([isActive])
 * }
 *
 * enum Platform {
 *   IOS
 *   ANDROID
 *   WEB
 * }
 */

export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: Platform;
  deviceId: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceTokenInput {
  userId: string;
  token: string;
  platform: Platform;
  deviceId: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
}

export interface UpdateDeviceTokenInput {
  token?: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
  isActive?: boolean;
}
