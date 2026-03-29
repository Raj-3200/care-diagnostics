import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { env } from '../../config/env.js';
import { TokenPayload } from '../types/auth.types.js';
import { UnauthorizedError } from '../errors/AppError.js';

const tokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

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
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return tokenPayloadSchema.parse(decoded);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    return tokenPayloadSchema.parse(decoded);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};
