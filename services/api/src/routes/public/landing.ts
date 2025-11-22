import { Router } from 'express';
import { LandingPublicController } from '../../controllers/public/LandingPublicController';

const router = Router();

router.get('/hero', LandingPublicController.hero);
router.get('/sections', LandingPublicController.sections);
router.get('/cta', LandingPublicController.cta);
router.get('/pricing', LandingPublicController.pricing);
router.get('/testimonials', LandingPublicController.testimonials);
router.get('/blog-cards', LandingPublicController.blogCards);
router.get('/comparisons', LandingPublicController.comparisonTables);

export default router;

