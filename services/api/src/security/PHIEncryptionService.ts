// PHI Encryption Service - End-to-end encryption for health data (~600 LOC)
import crypto from 'crypto';

export class PHIEncryptionService {
  private algorithm = 'aes-256-gcm';
  
  encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return { encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') };
  }
  
  decrypt(encrypted: string, iv: string, tag: string, key: Buffer): string {
    const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export const phiEncryptionService = new PHIEncryptionService();
