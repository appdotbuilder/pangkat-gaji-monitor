import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promotionScheduleTable, employeesTable } from '../db/schema';
import { type CreatePromotionScheduleInput } from '../schema';
import { createPromotionSchedule } from '../handlers/create_promotion_schedule';
import { eq } from 'drizzle-orm';

describe('createPromotionSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testEmployeeId: number;

  beforeEach(async () => {
    // Create a test employee for promotion schedule tests
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Software Developer',
        hire_date: new Date('2020-01-15')
      })
      .returning()
      .execute();

    testEmployeeId = employeeResult[0].id;
  });

  // Test input with all required fields
  const createTestInput = (overrides: Partial<CreatePromotionScheduleInput> = {}): CreatePromotionScheduleInput => ({
    employee_id: testEmployeeId,
    current_position: 'Software Developer',
    target_position: 'Senior Software Developer',
    current_salary: 75000,
    target_salary: 85000,
    scheduled_date: new Date('2024-06-01'),
    status: 'pending', // Include default value explicitly
    notes: 'Promotion based on excellent performance',
    ...overrides
  });

  it('should create a promotion schedule', async () => {
    const testInput = createTestInput();
    const result = await createPromotionSchedule(testInput);

    // Basic field validation
    expect(result.employee_id).toEqual(testEmployeeId);
    expect(result.current_position).toEqual('Software Developer');
    expect(result.target_position).toEqual('Senior Software Developer');
    expect(result.current_salary).toEqual(75000);
    expect(typeof result.current_salary).toEqual('number');
    expect(result.target_salary).toEqual(85000);
    expect(typeof result.target_salary).toEqual('number');
    expect(result.scheduled_date).toEqual(new Date('2024-06-01'));
    expect(result.status).toEqual('pending');
    expect(result.notes).toEqual('Promotion based on excellent performance');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save promotion schedule to database', async () => {
    const testInput = createTestInput();
    const result = await createPromotionSchedule(testInput);

    // Query using proper drizzle syntax
    const promotionSchedules = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, result.id))
      .execute();

    expect(promotionSchedules).toHaveLength(1);
    const schedule = promotionSchedules[0];
    expect(schedule.employee_id).toEqual(testEmployeeId);
    expect(schedule.current_position).toEqual('Software Developer');
    expect(schedule.target_position).toEqual('Senior Software Developer');
    expect(parseFloat(schedule.current_salary)).toEqual(75000);
    expect(parseFloat(schedule.target_salary)).toEqual(85000);
    expect(schedule.scheduled_date).toEqual(new Date('2024-06-01'));
    expect(schedule.status).toEqual('pending');
    expect(schedule.notes).toEqual('Promotion based on excellent performance');
    expect(schedule.created_at).toBeInstanceOf(Date);
    expect(schedule.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different promotion status values', async () => {
    const testInput = createTestInput({ status: 'approved' });
    const result = await createPromotionSchedule(testInput);

    expect(result.status).toEqual('approved');

    // Verify in database
    const schedule = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, result.id))
      .execute();

    expect(schedule[0].status).toEqual('approved');
  });

  it('should handle null notes field', async () => {
    const testInput = createTestInput({ notes: undefined });
    const result = await createPromotionSchedule(testInput);

    expect(result.notes).toBeNull();

    // Verify in database
    const schedule = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, result.id))
      .execute();

    expect(schedule[0].notes).toBeNull();
  });

  it('should handle decimal salary amounts', async () => {
    const testInput = createTestInput({
      current_salary: 75000.50,
      target_salary: 85999.99
    });
    const result = await createPromotionSchedule(testInput);

    // Verify numeric conversion
    expect(result.current_salary).toEqual(75000.50);
    expect(result.target_salary).toEqual(85999.99);
    expect(typeof result.current_salary).toEqual('number');
    expect(typeof result.target_salary).toEqual('number');

    // Verify in database
    const schedule = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, result.id))
      .execute();

    expect(parseFloat(schedule[0].current_salary)).toEqual(75000.50);
    expect(parseFloat(schedule[0].target_salary)).toEqual(85999.99);
  });

  it('should throw error when employee does not exist', async () => {
    const testInput = createTestInput({ employee_id: 999999 });

    await expect(createPromotionSchedule(testInput))
      .rejects
      .toThrow(/Employee with id 999999 not found/i);
  });

  it('should create multiple promotion schedules for same employee', async () => {
    const firstInput = createTestInput({
      target_position: 'Senior Software Developer',
      scheduled_date: new Date('2024-06-01')
    });
    const secondInput = createTestInput({
      current_position: 'Senior Software Developer',
      target_position: 'Lead Software Developer',
      current_salary: 85000,
      target_salary: 95000,
      scheduled_date: new Date('2025-01-01')
    });

    const firstResult = await createPromotionSchedule(firstInput);
    const secondResult = await createPromotionSchedule(secondInput);

    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.employee_id).toEqual(secondResult.employee_id);
    expect(firstResult.target_position).toEqual('Senior Software Developer');
    expect(secondResult.target_position).toEqual('Lead Software Developer');

    // Verify both records exist in database
    const allSchedules = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.employee_id, testEmployeeId))
      .execute();

    expect(allSchedules).toHaveLength(2);
  });
});