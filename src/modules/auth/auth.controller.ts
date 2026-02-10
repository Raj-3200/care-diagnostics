import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from './auth.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import { AuthenticatedRequest } from '../../shared/types/auth.types.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as { email: string; password: string };
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const result = await authService.login(body.email, body.password, ipAddress, userAgent);
    sendSuccess(res, result, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as { refreshToken: string };
    const result = await authService.refreshToken(body.refreshToken);
    sendSuccess(res, result, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    // In a production system, you'd invalidate the refresh token here
    // For now, just return success
    sendSuccess(res, { message: 'Logged out successfully' }, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await authService.getProfile(req.user.userId);
    sendSuccess(res, user, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};
