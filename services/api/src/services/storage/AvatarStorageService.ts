import { getSupabaseClient } from '../supabase/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

export class AvatarStorageService {
  static readonly bucketName = 'avatars';

  static async uploadUserAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const supabase = getSupabaseClient();

    const extension = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const objectPath = `${userId}/${uuidv4()}.${extension}`;

    const { error } = await supabase.storage
      .from(AvatarStorageService.bucketName)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    const { data } = supabase.storage.from(AvatarStorageService.bucketName).getPublicUrl(objectPath);
    return data.publicUrl;
  }
}


