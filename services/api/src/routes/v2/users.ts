import { Router } from 'express';
import { authMiddleware as authenticate } from '../../middleware/auth';
import { uploadSingle, handleUploadError, validateFileSizes } from '../../middleware/upload';
import { AvatarStorageService } from '../../services/storage/AvatarStorageService';
import { UserService } from '../../services/userService';

const router = Router();

// POST /api/v2/users/:id/avatar - upload avatar to Supabase Storage
router.post(
  '/:id/avatar',
  authenticate,
  // ensure only the owner (or admin via existing role checks elsewhere) updates avatar
  uploadSingle('avatar'),
  validateFileSizes,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { id } = req.params;
      const requester = req.user;
      if (requester.role !== 'admin' && requester.id !== id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const publicUrl = await AvatarStorageService.uploadUserAvatar(id, req.file);

      await UserService.update(id, { avatarUrl: publicUrl } as unknown);

      return res.json({ success: true, data: { avatarUrl: publicUrl } });
    } catch (err) {
      return handleUploadError(err, req, res, next);
    }
  }
);

export default router;


