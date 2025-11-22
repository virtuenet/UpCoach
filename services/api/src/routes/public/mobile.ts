import { Router } from 'express';
import { LandingPublicController } from '../../controllers/public/LandingPublicController';

const router = Router();

router.get('/content-blocks', LandingPublicController.sections);
router.get('/cta-blocks', LandingPublicController.cta);
router.get('/strings', LandingPublicController.mobileStrings);

export default router;

