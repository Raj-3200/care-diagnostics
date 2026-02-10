import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { TokenPayload } from '../types/auth.types.js';
import { UnauthorizedError } from '../errors/AppError.js';

export const generateAccessToken = (payload: TokenPayload): string => {
  return (jwt.sign as (payload: object, secret: string, options: { expiresIn: string }) => string)(
    payload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    },
  );
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return (jwt.sign as (payload: object, secret: string, options: { expiresIn: string }) => string)(
    payload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    },
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};
