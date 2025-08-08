import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, promotionScheduleTable } from '../db/schema';
import { type UpdatePromotionScheduleInput } from '../schema';
import { updatePromotionSchedule } from '../handlers/update_promotion_schedule';
import { eq } from 'drizzle-orm';

describe('updatePromotionSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testEmployee: any;
  let testPromotionSchedule: any;

  beforeEach(async () => {
    // Create a test employee first (required for foreign key)
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Junior Developer',
        hire_date: new Date('2023-01-15')
      })
      .returning()
      .execute();

    testEmployee = employeeResult[0];

    // Create a test promotion schedule
    const scheduleResult = await db.insert(promotionScheduleTable)
      .values({
        employee_id: testEmployee.id,
        current_position: 'Junior Developer',
        target_position: 'Senior Developer',
        current_salary: '50000.00',
        target_salary: '70000.00',
        scheduled_date: new Date('2024-06-01'),
        status: 'pending',
        notes: 'Initial promotion schedule'
      })
      .returning()
      .execute();

    testPromotionSchedule = scheduleResult[0];
  });

  it('should update target position', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      target_position: 'Lead Developer'
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.target_position).toEqual('Lead Developer');
    expect(result.current_position).toEqual('Junior Developer'); // Unchanged
    expect(result.target_salary).toEqual(70000); // Unchanged
    expect(result.status).toEqual('pending'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testPromotionSchedule.updated_at).toBe(true);
  });

  it('should update target salary', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      target_salary: 85000.50
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.target_salary).toEqual(85000.5);
    expect(typeof result.target_salary).toBe('number');
    expect(result.target_position).toEqual('Senior Developer'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update scheduled date', async () => {
    const newDate = new Date('2024-09-15');
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      scheduled_date: newDate
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.scheduled_date).toEqual(newDate);
    expect(result.target_position).toEqual('Senior Developer'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update status', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      status: 'approved'
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.status).toEqual('approved');
    expect(result.target_position).toEqual('Senior Developer'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update notes', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      notes: 'Updated notes for promotion'
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.notes).toEqual('Updated notes for promotion');
    expect(result.target_position).toEqual('Senior Developer'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update notes to null', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      notes: null
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.notes).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const newDate = new Date('2024-12-01');
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      target_position: 'Principal Developer',
      target_salary: 95000,
      scheduled_date: newDate,
      status: 'approved',
      notes: 'Approved for principal promotion'
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.target_position).toEqual('Principal Developer');
    expect(result.target_salary).toEqual(95000);
    expect(typeof result.target_salary).toBe('number');
    expect(result.scheduled_date).toEqual(newDate);
    expect(result.status).toEqual('approved');
    expect(result.notes).toEqual('Approved for principal promotion');
    expect(result.current_position).toEqual('Junior Developer'); // Unchanged
    expect(result.current_salary).toEqual(50000); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testPromotionSchedule.updated_at).toBe(true);
  });

  it('should persist changes to database', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      target_position: 'Tech Lead',
      target_salary: 90000
    };

    await updatePromotionSchedule(input);

    // Query database directly to verify persistence
    const schedules = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, testPromotionSchedule.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].target_position).toEqual('Tech Lead');
    expect(parseFloat(schedules[0].target_salary)).toEqual(90000);
    expect(schedules[0].updated_at).toBeInstanceOf(Date);
    expect(schedules[0].updated_at > testPromotionSchedule.updated_at).toBe(true);
  });

  it('should throw error for non-existent promotion schedule', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: 99999,
      target_position: 'Senior Developer'
    };

    await expect(updatePromotionSchedule(input)).rejects.toThrow(/not found/i);
  });

  it('should handle updating only updated_at when no fields provided', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id
    };

    const result = await updatePromotionSchedule(input);

    expect(result.id).toEqual(testPromotionSchedule.id);
    expect(result.target_position).toEqual('Senior Developer'); // Unchanged
    expect(result.target_salary).toEqual(70000); // Unchanged
    expect(result.status).toEqual('pending'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testPromotionSchedule.updated_at).toBe(true);
  });

  it('should handle different status values', async () => {
    const statuses = ['pending', 'approved', 'completed', 'cancelled'] as const;
    
    for (const status of statuses) {
      const input: UpdatePromotionScheduleInput = {
        id: testPromotionSchedule.id,
        status: status
      };

      const result = await updatePromotionSchedule(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should handle decimal salary values correctly', async () => {
    const input: UpdatePromotionScheduleInput = {
      id: testPromotionSchedule.id,
      target_salary: 75250.75
    };

    const result = await updatePromotionSchedule(input);

    expect(result.target_salary).toEqual(75250.75);
    expect(typeof result.target_salary).toBe('number');

    // Verify precision in database
    const schedules = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, testPromotionSchedule.id))
      .execute();

    expect(parseFloat(schedules[0].target_salary)).toEqual(75250.75);
  });
});