import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginSchema, refreshSchema } from './auth.validators.js';

const router = Router();

router.post(
  '/login',
  validate(loginSchema),
  (req, res, next) => void authController.login(req, res, next),
);
router.post(
  '/refresh',
  validate(refreshSchema),
  (req, res, next) => void authController.refresh(req, res, next),
);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, (req, res, next) => void authController.me(req, res, next));

export default router;
