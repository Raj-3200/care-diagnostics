import { prisma } from '../../config/database.js';

const reportIncludes = {
  visit: {
    include: {
      patient: true,
      testOrders: {
        include: {
          test: true,
          result: true,
        },
      },
    },
  },
  approvedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
};

export const findById = async (id: string) => {
  return prisma.report.findFirst({
    where: { id, deletedAt: null },
    include: reportIncludes,
  });
};

export const findByReportNumber = async (reportNumber: string) => {
  return prisma.report.findFirst({
    where: { reportNumber, deletedAt: null },
    include: reportIncludes,
  });
};

export const findByVisitId = async (visitId: string) => {
  return prisma.report.findFirst({
    where: { visitId, deletedAt: null },
    include: reportIncludes,
  });
};

export const findAll = async (params: {
  page: number;
  limit: number;
  status?: string;
  patientId?: string;
}) => {
  const { page, limit, status, patientId } = params;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (status) where.status = status;
  if (patientId) {
    where.visit = { patientId, deletedAt: null };
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: reportIncludes,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return { reports, total };
};

export const create = async (data: {
  visitId: string;
  reportNumber: string;
  notes?: string | null;
}) => {
  return prisma.report.create({
    data: {
      visitId: data.visitId,
      reportNumber: data.reportNumber,
      notes: data.notes ?? undefined,
    },
    include: reportIncludes,
  });
};

export const update = async (
  id: string,
  data: {
    status?: any;
    fileUrl?: string | null;
    generatedAt?: Date | null;
    approvedById?: string | null;
    approvedAt?: Date | null;
    notes?: string | null;
  },
) => {
  return prisma.report.update({
    where: { id },
    data: data as any,
    include: reportIncludes,
  });
};

export const updateStatus = async (
  id: string,
  status: any,
  extraData?: Record<string, any>,
) => {
  return prisma.report.update({
    where: { id },
    data: { status, ...extraData },
    include: reportIncludes,
  });
};

export const softDelete = async (id: string) => {
  return prisma.report.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
