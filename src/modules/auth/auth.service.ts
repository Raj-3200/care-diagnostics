import { prisma } from '../../config/database.js';
import { UnauthorizedError, NotFoundError } from '../../shared/errors/AppError.js';
import { comparePassword } from '../../shared/utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/jwt.js';
import { TokenPayload } from '../../shared/types/auth.types.js';
import { CONSTANTS } from '../../config/constants.js';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const login = async (
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LoginResponse> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: CONSTANTS.AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const refreshToken = async (token: string): Promise<{ accessToken: string }> => {
  const payload = verifyRefreshToken(token);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Generate new access token
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);

  return { accessToken };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};
