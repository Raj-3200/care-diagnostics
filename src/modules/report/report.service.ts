import * as reportRepository from './report.repository.js';
import * as visitRepository from '../visit/visit.repository.js';
import { prisma } from '../../config/database.js';
import { CONSTANTS } from '../../config/constants.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/AppError.js';
import { ReportStatus, ResultStatus } from '@prisma/client';

// Auto-generate report number: CD-RPT-YYYYMMDD-XXXX
const generateReportNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');

  const prefix = `CD-RPT-${dateStr}`;

  const lastReport = await prisma.report.findFirst({
    where: { reportNumber: { startsWith: prefix } },
    orderBy: { reportNumber: 'desc' },
  });

  let sequence = 1;
  if (lastReport) {
    const parts = lastReport.reportNumber.split('-');
    sequence = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
};

/**
 * Create a new report for a visit
 */
export const createReport = async (
  visitId: string,
  notes: string | undefined,
  userId: string,
) => {
  // Validate visit exists
  const visit = await visitRepository.findById(visitId);
  if (!visit) {
    throw new NotFoundError('Visit not found');
  }

  // Check if report already exists for this visit
  const existingReport = await reportRepository.findByVisitId(visitId);
  if (existingReport) {
    throw new ConflictError('Report already exists for this visit');
  }

  const reportNumber = await generateReportNumber();

  const report = await reportRepository.create({
    visitId,
    reportNumber,
    notes,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: CONSTANTS.AUDIT_ACTIONS.REPORT_GENERATED,
      entity: 'Report',
      entityId: report.id,
      newValue: { reportNumber, visitId },
    },
  });

  return report;
};

/**
 * Get report by ID
 */
export const getReportById = async (id: string) => {
  const report = await reportRepository.findById(id);
  if (!report) {
    throw new NotFoundError('Report not found');
  }
  return report;
};

/**
 * Get report by report number
 */
export const getReportByNumber = async (reportNumber: string) => {
  const report = await reportRepository.findByReportNumber(reportNumber);
  if (!report) {
    throw new NotFoundError('Report not found');
  }
  return report;
};

/**
 * Get report by visit ID
 */
export const getReportByVisit = async (visitId: string) => {
  const report = await reportRepository.findByVisitId(visitId);
  if (!report) {
    throw new NotFoundError('Report not found for this visit');
  }
  return report;
};

/**
 * List all reports (paginated, filterable)
 */
export const listReports = async (params: {
  page: number;
  limit: number;
  status?: string;
  patientId?: string;
}) => {
  return reportRepository.findAll(params);
};

/**
 * Generate report — moves from PENDING → GENERATED
 * All results for the visit must be verified first
 */
export const generateReport = async (
  id: string,
  data: { fileUrl?: string; notes?: string },
  userId: string,
) => {
  const report = await reportRepository.findById(id);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.status !== ReportStatus.PENDING) {
    throw new ValidationError(
      `Cannot generate report in ${report.status} status. Must be PENDING.`,
    );
  }

  // Ensure test orders with results all have them verified
  const testOrders = report.visit.testOrders;
  const ordersWithResults = testOrders.filter((to) => to.result);
  const unverifiedResults = ordersWithResults.filter(
    (to) => to.result.status !== ResultStatus.VERIFIED,
  );

  if (ordersWithResults.length === 0) {
    throw new ValidationError(
      'Cannot generate report: no test orders have results yet. Process samples and enter results first.',
    );
  }

  if (unverifiedResults.length > 0) {
    throw new ValidationError(
      `Cannot generate report: ${unverifiedResults.length} result(s) are not yet verified.`,
    );
  }

  const updated = await reportRepository.update(id, {
    status: ReportStatus.GENERATED,
    fileUrl: data.fileUrl ?? null,
    generatedAt: new Date(),
    notes: data.notes ?? report.notes,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: CONSTANTS.AUDIT_ACTIONS.REPORT_GENERATED,
      entity: 'Report',
      entityId: id,
      oldValue: { status: report.status },
      newValue: { status: ReportStatus.GENERATED },
    },
  });

  return updated;
};

/**
 * Approve report — moves from GENERATED → APPROVED
 * Only pathologist can approve
 */
export const approveReport = async (
  id: string,
  notes: string | undefined,
  userId: string,
) => {
  const report = await reportRepository.findById(id);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.status !== ReportStatus.GENERATED) {
    throw new ValidationError(
      `Cannot approve report in ${report.status} status. Must be GENERATED.`,
    );
  }

  const updated = await reportRepository.update(id, {
    status: ReportStatus.APPROVED,
    approvedById: userId,
    approvedAt: new Date(),
    notes: notes ?? report.notes,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'REPORT_APPROVED',
      entity: 'Report',
      entityId: id,
      oldValue: { status: report.status },
      newValue: { status: ReportStatus.APPROVED, approvedById: userId },
    },
  });

  return updated;
};

/**
 * Dispatch report — moves from APPROVED → DISPATCHED
 */
export const dispatchReport = async (
  id: string,
  notes: string | undefined,
  userId: string,
) => {
  const report = await reportRepository.findById(id);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.status !== ReportStatus.APPROVED) {
    throw new ValidationError(
      `Cannot dispatch report in ${report.status} status. Must be APPROVED.`,
    );
  }

  const updated = await reportRepository.update(id, {
    status: ReportStatus.DISPATCHED,
    notes: notes ?? report.notes,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'REPORT_DISPATCHED',
      entity: 'Report',
      entityId: id,
      oldValue: { status: report.status },
      newValue: { status: ReportStatus.DISPATCHED },
    },
  });

  return updated;
};

/**
 * Delete report (soft delete) — only if PENDING
 */
export const deleteReport = async (id: string, userId: string) => {
  const report = await reportRepository.findById(id);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.status !== ReportStatus.PENDING) {
    throw new ValidationError(
      'Cannot delete report that has already been generated. Only PENDING reports can be deleted.',
    );
  }

  await reportRepository.softDelete(id);

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'REPORT_DELETED',
      entity: 'Report',
      entityId: id,
      oldValue: { reportNumber: report.reportNumber, status: report.status },
    },
  });
};
