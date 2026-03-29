import * as resultRepository from './result.repository.js';
import * as reportRepository from '../report/report.repository.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
import { PaginationParams } from '../../shared/types/common.types.js';
import { prisma } from '../../config/database.js';
import { CONSTANTS } from '../../config/constants.js';
import {
  CreateResultInput,
  EnterResultInput,
  VerifyResultInput,
  RejectResultInput,
} from './result.validators.js';
import { ResultStatus } from '@prisma/client';

/**
 * Create a result placeholder for a test order
 * This initializes the result entry workflow
 */
export const createResult = async (data: CreateResultInput) => {
  // Verify test order exists
  const testOrder = await prisma.testOrder.findUnique({
    where: { id: data.testOrderId, deletedAt: null },
  });

  if (!testOrder) {
    throw new NotFoundError('Test order not found');
  }

  // Check if result already exists
  const existingResult = await resultRepository.findByTestOrderId(data.testOrderId);
  if (existingResult) {
    throw new ConflictError('Result already exists for this test order');
  }

  // Create result
  const result = await resultRepository.create(data);

  return result;
};

/**
 * Get result by ID
 */
export const getResultById = async (resultId: string) => {
  const result = await resultRepository.findById(resultId);

  if (!result) {
    throw new NotFoundError('Result not found');
  }

  return result;
};

/**
 * Get result by test order ID
 */
export const getResultByTestOrder = async (testOrderId: string) => {
  const result = await resultRepository.findByTestOrderId(testOrderId);

  if (!result) {
    throw new NotFoundError('Result not found for this test order');
  }

  return result;
};

/**
 * List all results with optional filters
 */
export const listResults = async (
  pagination: PaginationParams,
  filters?: { status?: ResultStatus; visitId?: string },
) => {
  return resultRepository.findAll(pagination, filters);
};

/**
 * Enter result values
 * Lab technician enters the numeric/value result
 * This marks result as ENTERED (pending verification)
 */
export const enterResult = async (
  resultId: string,
  data: EnterResultInput,
  enteredByUserId: string,
) => {
  // Verify result exists
  const existingResult = await resultRepository.findById(resultId);
  if (!existingResult) {
    throw new NotFoundError('Result not found');
  }

  // Check that result is in initial state
  if (existingResult.status !== ResultStatus.PENDING) {
    throw new ConflictError(`Cannot enter result for result in ${existingResult.status} status`);
  }

  // Update result with values
  const updatedResult = await resultRepository.update(resultId, {
    value: data.value,
    unit: data.unit ?? null,
    referenceRange: data.referenceRange ?? null,
    isAbnormal: data.isAbnormal,
    remarks: data.remarks ?? null,
    status: ResultStatus.ENTERED,
    enteredById: enteredByUserId,
    enteredAt: new Date(),
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: enteredByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.RESULT_ENTERED,
      entity: 'Result',
      entityId: resultId,
      newValue: {
        status: updatedResult.status,
        value: updatedResult.value,
        isAbnormal: updatedResult.isAbnormal,
      },
    },
  });

  return updatedResult;
};

/**
 * Verify/approve result
 * Pathologist reviews entered result and confirms correctness
 * This locks the result for reporting
 */
export const verifyResult = async (
  resultId: string,
  data: VerifyResultInput,
  verifiedByUserId: string,
) => {
  // Verify result exists
  const existingResult = await resultRepository.findById(resultId);
  if (!existingResult) {
    throw new NotFoundError('Result not found');
  }

  // Check that result is ENTERED and ready for verification
  if (existingResult.status !== ResultStatus.ENTERED) {
    throw new ConflictError(
      `Cannot verify result in ${existingResult.status} status. Result must be ENTERED.`,
    );
  }

  // Check that result has values
  if (!existingResult.value) {
    throw new ConflictError('Cannot verify result without values');
  }

  // Update result with verification
  const updatedResult = await resultRepository.update(resultId, {
    status: ResultStatus.VERIFIED,
    isAbnormal: data.isAbnormal !== undefined ? data.isAbnormal : existingResult.isAbnormal,
    remarks: data.remarks !== undefined ? (data.remarks ?? null) : (existingResult.remarks ?? null),
    verifiedById: verifiedByUserId,
    verifiedAt: new Date(),
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: verifiedByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.RESULT_VERIFIED,
      entity: 'Result',
      entityId: resultId,
      newValue: {
        status: updatedResult.status,
        verifiedAt: updatedResult.verifiedAt,
        isAbnormal: updatedResult.isAbnormal,
      },
    },
  });

  // Auto-create report when ALL results for the visit are verified
  try {
    const visitId = updatedResult.testOrder?.visit?.id;
    if (visitId) {
      // Check if all test orders for this visit have verified results
      const testOrders = await prisma.testOrder.findMany({
        where: { visitId, deletedAt: null },
        include: { result: true },
      });

      const allVerified =
        testOrders.length > 0 &&
        testOrders.every((to) => to.result && to.result.status === ResultStatus.VERIFIED);

      if (allVerified) {
        // Check if report already exists
        const existingReport = await reportRepository.findByVisitId(visitId);
        if (!existingReport) {
          // Generate report number
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
          const reportNumber = `${prefix}-${sequence.toString().padStart(4, '0')}`;

          await reportRepository.create({
            visitId,
            reportNumber,
            notes: 'Auto-created after all results verified',
          });
        }
      }
    }
  } catch {
    // Don't fail the verify if auto-report creation fails
  }

  return updatedResult;
};

/**
 * Reject result
 * Result was entered incorrectly and needs re-entry
 */
export const rejectResult = async (
  resultId: string,
  data: RejectResultInput,
  rejectedByUserId: string,
) => {
  // Verify result exists
  const existingResult = await resultRepository.findById(resultId);
  if (!existingResult) {
    throw new NotFoundError('Result not found');
  }

  // Can only reject ENTERED results
  if (existingResult.status !== ResultStatus.ENTERED) {
    throw new ConflictError(
      `Cannot reject result in ${existingResult.status} status. Only ENTERED results can be rejected.`,
    );
  }

  // Update result as rejected
  const updatedResult = await resultRepository.update(resultId, {
    status: ResultStatus.REJECTED,
    rejectionReason: data.rejectionReason,
    // Reset values so lab tech can re-enter
    value: '',
    remarks: null,
    enteredById: null,
    enteredAt: null,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: rejectedByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.RESULT_REJECTED,
      entity: 'Result',
      entityId: resultId,
      oldValue: { status: existingResult.status },
      newValue: {
        status: updatedResult.status,
        rejectionReason: data.rejectionReason,
      },
    },
  });

  return updatedResult;
};

/**
 * Re-enter rejected result
 * After rejection, lab tech can re-enter the result
 * Returns result to PENDING state
 */
export const reEnterResult = async (
  resultId: string,
  data: EnterResultInput,
  enteredByUserId: string,
) => {
  // Verify result exists
  const existingResult = await resultRepository.findById(resultId);
  if (!existingResult) {
    throw new NotFoundError('Result not found');
  }

  // Check that result is REJECTED
  if (existingResult.status !== ResultStatus.REJECTED) {
    throw new ConflictError(
      `Cannot re-enter result in ${existingResult.status} status. Only REJECTED results can be re-entered.`,
    );
  }

  // Update result with new values
  const updatedResult = await resultRepository.update(resultId, {
    value: data.value,
    unit: data.unit ?? null,
    referenceRange: data.referenceRange ?? null,
    isAbnormal: data.isAbnormal,
    remarks: data.remarks ?? null,
    status: ResultStatus.ENTERED,
    enteredById: enteredByUserId,
    enteredAt: new Date(),
    rejectionReason: null,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: enteredByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.RESULT_ENTERED,
      entity: 'Result',
      entityId: resultId,
      newValue: {
        status: updatedResult.status,
        value: updatedResult.value,
      },
    },
  });

  return updatedResult;
};
