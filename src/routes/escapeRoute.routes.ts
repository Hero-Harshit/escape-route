import { Router } from 'express';
import { EscapeRouteController } from '../controllers/escapeRoute.controller';

const router = Router();
const escapeRouteController = new EscapeRouteController();

// POST /api/escape-route
router.post('/escape-route', escapeRouteController.generateEscapeRoute);

export default router;
