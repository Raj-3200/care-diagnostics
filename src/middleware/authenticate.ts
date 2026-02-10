import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/types/auth.types.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';
import { verifyAccessToken } from '../shared/utils/jwt.js';

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
