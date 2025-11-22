import { Router } from 'express';
import { MarketplaceController } from '../controllers/MarketplaceController';

const router = Router();

router.get('/marketplace/coaches', MarketplaceController.listCoaches);
router.get('/marketplace/coaches/:id', MarketplaceController.getCoach);

export default router;


