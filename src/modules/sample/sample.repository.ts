import { prisma } from '../../config/database.js';
import { Sample, SampleStatus } from '@prisma/client';
import { PaginationParams } from '../../shared/types/common.types.js';

export type SampleWithRelations = Sample & {
  testOrder?: any;
};

export const findById = async (id: string): Promise<SampleWithRelations | null> => {
  return prisma.sample.findUnique({
    where: { id, deletedAt: null },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const findByBarcode = async (barcode: string): Promise<SampleWithRelations | null> => {
  return prisma.sample.findUnique({
    where: { barcode, deletedAt: null },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const findByTestOrderId = async (testOrderId: string): Promise<SampleWithRelations | null> => {
  return prisma.sample.findUnique({
    where: { testOrderId, deletedAt: null },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const findAll = async (
  pagination: PaginationParams,
  filters?: { status?: SampleStatus }
): Promise<{ samples: SampleWithRelations[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    deletedAt: null,
  };

  if (filters?.status) whereClause.status = filters.status;

  const [samples, total] = await Promise.all([
    prisma.sample.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        testOrder: { include: { test: true, visit: { include: { patient: true } } } },
        collectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.sample.count({ where: whereClause }),
  ]);

  return { samples, total };
};

export const create = async (data: {
  testOrderId: string;
  barcode: string;
  sampleType: any;
  notes?: string | null;
}): Promise<SampleWithRelations> => {
  const createData: any = { ...data };
  if (data.notes === null) createData.notes = undefined;

  return prisma.sample.create({
    data: createData,
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const update = async (
  id: string,
  data: {
    status?: SampleStatus;
    collectedAt?: Date;
    collectedById?: string;
    rejectionReason?: string;
    notes?: string;
  }
): Promise<SampleWithRelations> => {
  return prisma.sample.update({
    where: { id, deletedAt: null },
    data,
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const updateStatus = async (id: string, status: SampleStatus): Promise<SampleWithRelations> => {
  return prisma.sample.update({
    where: { id, deletedAt: null },
    data: { status },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const softDelete = async (id: string): Promise<void> => {
  await prisma.sample.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
};
