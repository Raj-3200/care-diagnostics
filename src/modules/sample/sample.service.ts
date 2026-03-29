import * as sampleRepository from './sample.repository.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
import { PaginationParams } from '../../shared/types/common.types.js';
import { prisma } from '../../config/database.js';
import { CONSTANTS } from '../../config/constants.js';
import {
  CreateSampleInput,
  RecordSampleCollectionInput,
  RejectSampleInput,
  UpdateSampleStatusInput,
} from './sample.validators.js';
import { SampleStatus } from '@prisma/client';
import crypto from 'crypto';

/**
 * Create a sample (initialize sample collection task)
 * Called when a lab tech is ready to collect a sample for a test order
 */
export const createSample = async (data: CreateSampleInput) => {
  // Verify test order exist and doesn't already have a sample
  const testOrder = await prisma.testOrder.findUnique({
    where: { id: data.testOrderId, deletedAt: null },
    include: { sample: true },
  });

  if (!testOrder) {
    throw new NotFoundError('Test order not found');
  }

  if (testOrder.sample) {
    throw new ConflictError('Sample already exists for this test order');
  }

  // Check for duplicate barcode
  const existingBarcode = await sampleRepository.findByBarcode(data.barcode);
  if (existingBarcode) {
    throw new ConflictError('A sample with this barcode already exists');
  }

  // Create sample
  const sample = await sampleRepository.create(data);

  return sample;
};

/**
 * Get sample by ID
 */
export const getSampleById = async (sampleId: string) => {
  const sample = await sampleRepository.findById(sampleId);

  if (!sample) {
    throw new NotFoundError('Sample not found');
  }

  return sample;
};

/**
 * Get sample by barcode
 * Used when lab tech scans barcode
 */
export const getSampleByBarcode = async (barcode: string) => {
  const sample = await sampleRepository.findByBarcode(barcode);

  if (!sample) {
    throw new NotFoundError('Sample not found');
  }

  return sample;
};

/**
 * Get sample for a test order
 */
export const getSampleByTestOrder = async (testOrderId: string) => {
  const sample = await sampleRepository.findByTestOrderId(testOrderId);

  if (!sample) {
    throw new NotFoundError('Sample not found for this test order');
  }

  return sample;
};

/**
 * Quick-collect: create a sample and mark it as collected in one step.
 * Auto-generates barcode and derives sampleType from the test.
 */
export const quickCollect = async (testOrderId: string, userId: string) => {
  const testOrder = await prisma.testOrder.findUnique({
    where: { id: testOrderId, deletedAt: null },
    include: { test: true, sample: true },
  });

  if (!testOrder) {
    throw new NotFoundError('Test order not found');
  }

  if (testOrder.sample) {
    throw new ConflictError('Sample already exists for this test order');
  }

  // Auto-generate barcode: CD-SMP-<random>
  const barcode = `CD-SMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const sampleType = testOrder.test?.sampleType ?? 'BLOOD';

  // Create sample and mark collected in one transaction
  const sample = await prisma.sample.create({
    data: {
      testOrderId,
      barcode,
      sampleType,
      status: SampleStatus.COLLECTED,
      collectedAt: new Date(),
      collectedById: userId,
    },
    include: {
      testOrder: { include: { test: true, visit: { include: { patient: true } } } },
      collectedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return sample;
};

/**
 * Receive sample in lab — transitions COLLECTED → IN_LAB
 */
export const receiveInLab = async (sampleId: string) => {
  const sample = await sampleRepository.findById(sampleId);
  if (!sample) {
    throw new NotFoundError('Sample not found');
  }

  if (sample.status !== SampleStatus.COLLECTED) {
    throw new ConflictError(`Cannot receive sample in ${sample.status} status. Must be COLLECTED.`);
  }

  const updated = await sampleRepository.update(sampleId, {
    status: SampleStatus.IN_LAB,
  });

  return updated;
};

/**
 * Mark sample as processed — transitions IN_LAB → PROCESSED
 * Also auto-creates a PENDING result record for the test order
 */
export const markProcessed = async (sampleId: string) => {
  const sample = await sampleRepository.findById(sampleId);
  if (!sample) {
    throw new NotFoundError('Sample not found');
  }

  if (sample.status !== SampleStatus.IN_LAB) {
    throw new ConflictError(`Cannot process sample in ${sample.status} status. Must be IN_LAB.`);
  }

  // Use a transaction to update sample + create result atomically
  const updated = await prisma.$transaction(
    async (tx) => {
      const updatedSample = await tx.sample.update({
        where: { id: sampleId, deletedAt: null },
        data: { status: SampleStatus.PROCESSED },
        include: {
          testOrder: { include: { test: true, visit: { include: { patient: true } } } },
          collectedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Auto-create a PENDING result for the test order (if not already existing)
      const existingResult = await tx.result.findFirst({
        where: { testOrderId: updatedSample.testOrderId, deletedAt: null },
      });

      if (!existingResult) {
        await tx.result.create({
          data: {
            testOrderId: updatedSample.testOrderId,
            value: '',
            status: 'PENDING',
          },
        });
      }

      return updatedSample;
    },
    { timeout: 15000 },
  );

  return updated;
};

/**
 * List all samples
 */
export const listSamples = async (
  pagination: PaginationParams,
  filters?: { status?: SampleStatus },
) => {
  return sampleRepository.findAll(pagination, filters);
};

/**
 * Record sample collection
 * Lab tech confirms they have collected the sample
 */
export const recordSampleCollection = async (
  sampleId: string,
  data: RecordSampleCollectionInput,
  recordedByUserId: string,
) => {
  // Verify sample exists
  const existingSample = await sampleRepository.findById(sampleId);
  if (!existingSample) {
    throw new NotFoundError('Sample not found');
  }

  // Check that sample is in correct state for collection
  if (existingSample.status !== SampleStatus.PENDING_COLLECTION) {
    throw new ConflictError(
      `Cannot record collection for sample in ${existingSample.status} status`,
    );
  }

  // Update sample with collection info
  const updatedSample = await sampleRepository.update(sampleId, {
    status: SampleStatus.COLLECTED,
    collectedAt: new Date(data.collectedAt),
    collectedById: data.collectedById,
    notes: data.notes || undefined,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: recordedByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.SAMPLE_COLLECTED,
      entity: 'Sample',
      entityId: sampleId,
      newValue: {
        status: updatedSample.status,
        collectedAt: updatedSample.collectedAt,
      },
    },
  });

  return updatedSample;
};

/**
 * Reject a sample
 * Lab tech marks sample as rejected (broken, contaminated, etc.)
 */
export const rejectSample = async (
  sampleId: string,
  data: RejectSampleInput,
  rejectedByUserId: string,
) => {
  // Verify sample exists
  const existingSample = await sampleRepository.findById(sampleId);
  if (!existingSample) {
    throw new NotFoundError('Sample not found');
  }

  // Can reject if in PENDING_COLLECTION or COLLECTED status
  if (
    existingSample.status !== SampleStatus.PENDING_COLLECTION &&
    existingSample.status !== SampleStatus.COLLECTED
  ) {
    throw new ConflictError(`Cannot reject sample in ${existingSample.status} status`);
  }

  // Update sample as rejected
  const updatedSample = await sampleRepository.update(sampleId, {
    status: SampleStatus.REJECTED,
    rejectionReason: data.rejectionReason,
    notes: data.notes || undefined,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: rejectedByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.SAMPLE_REJECTED,
      entity: 'Sample',
      entityId: sampleId,
      oldValue: { status: existingSample.status },
      newValue: {
        status: updatedSample.status,
        rejectionReason: data.rejectionReason,
      },
    },
  });

  return updatedSample;
};

/**
 * Update sample status
 * Track sample through lab workflow: IN_LAB -> PROCESSED
 */
export const updateSampleStatus = async (
  sampleId: string,
  data: UpdateSampleStatusInput,
  updatedByUserId: string,
) => {
  // Verify sample exists
  const existingSample = await sampleRepository.findById(sampleId);
  if (!existingSample) {
    throw new NotFoundError('Sample not found');
  }

  // Prevent invalid state transitions
  const validTransitions: Record<SampleStatus, SampleStatus[]> = {
    [SampleStatus.PENDING_COLLECTION]: [SampleStatus.COLLECTED, SampleStatus.REJECTED],
    [SampleStatus.COLLECTED]: [SampleStatus.IN_LAB, SampleStatus.REJECTED],
    [SampleStatus.IN_LAB]: [SampleStatus.PROCESSED, SampleStatus.REJECTED],
    [SampleStatus.PROCESSED]: [],
    [SampleStatus.REJECTED]: [],
  };

  if (
    existingSample.status !== data.status &&
    !validTransitions[existingSample.status as SampleStatus].includes(data.status)
  ) {
    throw new ConflictError(
      `Cannot transition sample from ${existingSample.status} to ${data.status}`,
    );
  }

  // Update status
  const updatedSample = await sampleRepository.updateStatus(sampleId, data.status);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedByUserId,
      action: CONSTANTS.AUDIT_ACTIONS.SAMPLE_STATUS_UPDATED,
      entity: 'Sample',
      entityId: sampleId,
      oldValue: { status: existingSample.status },
      newValue: { status: updatedSample.status },
    },
  });

  return updatedSample;
};
