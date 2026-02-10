import { prisma } from '../../config/database.js';
import { Visit, VisitStatus } from '@prisma/client';
import { PaginationParams } from '../../shared/types/common.types.js';

export type VisitWithRelations = Visit & {
  patient: any;
  createdBy: any;
  testOrders?: any[];
};

export const findById = async (id: string): Promise<VisitWithRelations | null> => {
  return prisma.visit.findUnique({
    where: { id, deletedAt: null },
    include: {
      patient: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      testOrders: { where: { deletedAt: null } },
    },
  });
};

export const findByVisitNumber = async (visitNumber: string): Promise<VisitWithRelations | null> => {
  return prisma.visit.findUnique({
    where: { visitNumber, deletedAt: null },
    include: {
      patient: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      testOrders: { where: { deletedAt: null } },
    },
  });
};

export const findByPatientId = async (
  patientId: string,
  pagination: PaginationParams
): Promise<{ visits: VisitWithRelations[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where: { patientId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        testOrders: { where: { deletedAt: null } },
      },
    }),
    prisma.visit.count({
      where: { patientId, deletedAt: null },
    }),
  ]);

  return { visits, total };
};

export const findAll = async (
  pagination: PaginationParams,
  filters?: { status?: VisitStatus; patientId?: string }
): Promise<{ visits: VisitWithRelations[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    deletedAt: null,
  };

  if (filters?.status) whereClause.status = filters.status;
  if (filters?.patientId) whereClause.patientId = filters.patientId;

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        testOrders: { where: { deletedAt: null } },
      },
    }),
    prisma.visit.count({ where: whereClause }),
  ]);

  return { visits, total };
};

export const create = async (data: {
  visitNumber: string;
  patientId: string;
  createdById: string;
  notes?: string;
}): Promise<VisitWithRelations> => {
  return prisma.visit.create({
    data,
    include: {
      patient: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      testOrders: { where: { deletedAt: null } },
    },
  });
};

export const updateStatus = async (
  id: string,
  status: VisitStatus
): Promise<VisitWithRelations> => {
  return prisma.visit.update({
    where: { id, deletedAt: null },
    data: { status },
    include: {
      patient: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      testOrders: { where: { deletedAt: null } },
    },
  });
};

export const update = async (
  id: string,
  data: {
    notes?: string;
    status?: VisitStatus;
  }
): Promise<VisitWithRelations> => {
  return prisma.visit.update({
    where: { id, deletedAt: null },
    data,
    include: {
      patient: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      testOrders: { where: { deletedAt: null } },
    },
  });
};

export const softDelete = async (id: string): Promise<void> => {
  await prisma.visit.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
};
