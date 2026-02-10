import * as testOrderRepository from './testOrder.repository.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
import { PaginationParams } from '../../shared/types/common.types.js';
import { prisma } from '../../config/database.js';
import { CreateTestOrderInput, UpdateTestOrderInput, BulkCreateTestOrderInput } from './testOrder.validators.js';

/**
 * Create a test order for a visit
 * This is the core workflow: receptionist/staff orders tests for a patient's visit
 * Each test order will generate a sample collection task and result entry task
 */
export const createTestOrder = async (
  data: CreateTestOrderInput,
  _createdByUserId: string
): Promise<any> => {
  // Verify visit exists
  const visit = await prisma.visit.findUnique({
    where: { id: data.visitId, deletedAt: null },
  });

  if (!visit) {
    throw new NotFoundError('Visit not found');
  }

  // Verify test exists and is active
  const test = await prisma.test.findUnique({
    where: { id: data.testId, deletedAt: null },
  });

  if (!test) {
    throw new NotFoundError('Test not found');
  }

  if (!test.isActive) {
    throw new ConflictError('Test is inactive and cannot be ordered');
  }

  // Check if this test is already ordered for this visit
  const existingOrder = await prisma.testOrder.findFirst({
    where: { visitId: data.visitId, testId: data.testId, deletedAt: null },
  });

  if (existingOrder) {
    throw new ConflictError('This test is already ordered for this visit');
  }

  // Create test order
  const createData: any = { ...data };
  if (data.notes === null) createData.notes = undefined;

  const testOrder = await testOrderRepository.create(createData);

  return testOrder;
};

/**
 * Create multiple test orders in one call (bulk order)
 * Receptionist often orders multiple tests in one visit
 */
export const bulkCreateTestOrders = async (
  visitId: string,
  tests: BulkCreateTestOrderInput,
  createdByUserId: string
): Promise<any[]> => {
  // Verify visit exists
  const visit = await prisma.visit.findUnique({
    where: { id: visitId, deletedAt: null },
  });

  if (!visit) {
    throw new NotFoundError('Visit not found');
  }

  // Create all test orders
  const testOrders = await Promise.all(
    tests.map((test) =>
      createTestOrder({ ...test, visitId }, createdByUserId)
    )
  );

  return testOrders;
};

/**
 * Get test order by ID
 */
export const getTestOrderById = async (testOrderId: string) => {
  const testOrder = await testOrderRepository.findById(testOrderId);

  if (!testOrder) {
    throw new NotFoundError('Test order not found');
  }

  return testOrder;
};

/**
 * Get all test orders for a visit
 */
export const getVisitTestOrders = async (visitId: string) => {
  // Verify visit exists
  const visit = await prisma.visit.findUnique({
    where: { id: visitId, deletedAt: null },
  });

  if (!visit) {
    throw new NotFoundError('Visit not found');
  }

  return testOrderRepository.findByVisitId(visitId);
};

/**
 * Get all test orders (paginated)
 * Admin can view all test orders
 */
export const getAllTestOrders = async (pagination: PaginationParams) => {
  return testOrderRepository.findAll(pagination);
};

/**
 * Update test order (priority, notes)
 */
export const updateTestOrder = async (
  testOrderId: string,
  data: UpdateTestOrderInput,
  _updatedByUserId: string
) => {
  // Verify test order exists
  const existingTestOrder = await testOrderRepository.findById(testOrderId);
  if (!existingTestOrder) {
    throw new NotFoundError('Test order not found');
  }

  // Update test order
  const updateData: any = { ...data };
  if (data.notes === null) updateData.notes = undefined;

  const updatedTestOrder = await testOrderRepository.update(testOrderId, updateData);

  return updatedTestOrder;
};

/**
 * Cancel/delete test order
 * Can only be deleted if no sample has been collected or result entered
 */
export const cancelTestOrder = async (testOrderId: string, _cancelledByUserId: string) => {
  // Verify test order exists
  const existingTestOrder = await testOrderRepository.findById(testOrderId);
  if (!existingTestOrder) {
    throw new NotFoundError('Test order not found');
  }

  // Check if sample has been collected
  if (existingTestOrder.sample) {
    throw new ConflictError(
      'Cannot cancel test order after sample has been collected. Please contact administrator.'
    );
  }

  // Check if result has been entered
  if (existingTestOrder.result) {
    throw new ConflictError(
      'Cannot cancel test order after result has been entered. Please contact administrator.'
    );
  }

  // Soft delete
  await testOrderRepository.softDelete(testOrderId);
};
