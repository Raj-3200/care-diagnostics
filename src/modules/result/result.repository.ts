import { prisma } from '../../config/database.js';
import { Result, ResultStatus } from '@prisma/client';
import { PaginationParams } from '../../shared/types/common.types.js';

export type ResultWithRelations = Result & {
  testOrder?: any;
};

export const findById = async (id: string): Promise<ResultWithRelations | null> => {
  return prisma.result.findUnique({
    where: { id, deletedAt: null },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      enteredBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const findByTestOrderId = async (testOrderId: string): Promise<ResultWithRelations | null> => {
  return prisma.result.findUnique({
    where: { testOrderId, deletedAt: null },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      enteredBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const findAll = async (
  pagination: PaginationParams,
  filters?: { status?: ResultStatus; visitId?: string }
): Promise<{ results: ResultWithRelations[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    deletedAt: null,
  };

  if (filters?.status) whereClause.status = filters.status;
  if (filters?.visitId) {
    whereClause.testOrder = { visit: { id: filters.visitId } };
  }

  const [results, total] = await Promise.all([
    prisma.result.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        testOrder: { include: { test: true, visit: { include: { patient: true } } } },
        enteredBy: { select: { id: true, firstName: true, lastName: true } },
        verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.result.count({ where: whereClause }),
  ]);

  return { results, total };
};

export const create = async (data: {
  testOrderId: string;
  value?: string;
}): Promise<ResultWithRelations> => {
  return prisma.result.create({
    data: {
      testOrderId: data.testOrderId,
      value: data.value || '',
    },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      enteredBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const update = async (
  id: string,
  data: {
    value?: string;
    unit?: string | null;
    referenceRange?: string | null;
    isAbnormal?: boolean;
    remarks?: string | null;
    status?: ResultStatus;
    enteredById?: string | null;
    enteredAt?: Date | null;
    verifiedById?: string | null;
    verifiedAt?: Date | null;
    rejectionReason?: string | null;
  }
): Promise<ResultWithRelations> => {
  return prisma.result.update({
    where: { id, deletedAt: null },
    data: data as any,
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      enteredBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const updateStatus = async (
  id: string,
  status: ResultStatus
): Promise<ResultWithRelations> => {
  return prisma.result.update({
    where: { id, deletedAt: null },
    data: { status },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      enteredBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const softDelete = async (id: string): Promise<void> => {
  await prisma.result.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
};
