import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, promotionScheduleTable } from '../db/schema';
import { getAllPromotionSchedules } from '../handlers/get_all_promotion_schedules';
import { eq } from 'drizzle-orm';

// Test data
const testEmployee1 = {
  name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@company.com',
  department: 'Engineering',
  position: 'Junior Developer',
  hire_date: new Date('2022-01-15')
};

const testEmployee2 = {
  name: 'Jane Smith',
  employee_id: 'EMP002',
  email: 'jane.smith@company.com',
  department: 'Marketing',
  position: 'Marketing Specialist',
  hire_date: new Date('2021-06-01')
};

describe('getAllPromotionSchedules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no promotion schedules exist', async () => {
    const result = await getAllPromotionSchedules();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all promotion schedules ordered by scheduled_date', async () => {
    // Create test employees first
    const [employee1, employee2] = await db.insert(employeesTable)
      .values([testEmployee1, testEmployee2])
      .returning()
      .execute();

    // Create promotion schedules with different dates
    const promotionSchedule1 = {
      employee_id: employee1.id,
      current_position: 'Junior Developer',
      target_position: 'Senior Developer',
      current_salary: 65000,
      target_salary: 85000,
      scheduled_date: new Date('2024-06-01'),
      status: 'pending' as const,
      notes: 'Performance review completed'
    };

    const promotionSchedule2 = {
      employee_id: employee2.id,
      current_position: 'Marketing Specialist',
      target_position: 'Senior Marketing Specialist',
      current_salary: 55000,
      target_salary: 70000,
      scheduled_date: new Date('2024-03-15'), // Earlier date
      status: 'approved' as const,
      notes: 'Excellent performance'
    };

    await db.insert(promotionScheduleTable)
      .values([
        {
          ...promotionSchedule1,
          current_salary: promotionSchedule1.current_salary.toString(),
          target_salary: promotionSchedule1.target_salary.toString()
        },
        {
          ...promotionSchedule2,
          current_salary: promotionSchedule2.current_salary.toString(),
          target_salary: promotionSchedule2.target_salary.toString()
        }
      ])
      .execute();

    const result = await getAllPromotionSchedules();

    expect(result).toHaveLength(2);
    
    // Should be ordered by scheduled_date (ascending)
    expect(result[0].scheduled_date.getTime()).toBeLessThan(result[1].scheduled_date.getTime());
    expect(result[0].target_position).toEqual('Senior Marketing Specialist'); // Earlier date
    expect(result[1].target_position).toEqual('Senior Developer'); // Later date

    // Verify numeric fields are properly converted
    expect(typeof result[0].current_salary).toBe('number');
    expect(typeof result[0].target_salary).toBe('number');
    expect(typeof result[1].current_salary).toBe('number');
    expect(typeof result[1].target_salary).toBe('number');

    // Verify salary values
    expect(result[0].current_salary).toEqual(55000);
    expect(result[0].target_salary).toEqual(70000);
    expect(result[1].current_salary).toEqual(65000);
    expect(result[1].target_salary).toEqual(85000);

    // Verify other fields
    expect(result[0].status).toEqual('approved');
    expect(result[1].status).toEqual('pending');
    expect(result[0].notes).toEqual('Excellent performance');
    expect(result[1].notes).toEqual('Performance review completed');
  });

  it('should handle promotion schedules with null notes', async () => {
    // Create test employee
    const [employee] = await db.insert(employeesTable)
      .values([testEmployee1])
      .returning()
      .execute();

    // Create promotion schedule with null notes
    await db.insert(promotionScheduleTable)
      .values([{
        employee_id: employee.id,
        current_position: 'Junior Developer',
        target_position: 'Mid-level Developer',
        current_salary: '60000',
        target_salary: '75000',
        scheduled_date: new Date('2024-04-01'),
        status: 'pending',
        notes: null
      }])
      .execute();

    const result = await getAllPromotionSchedules();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].target_position).toEqual('Mid-level Developer');
  });

  it('should handle multiple promotion schedules for same employee', async () => {
    // Create test employee
    const [employee] = await db.insert(employeesTable)
      .values([testEmployee1])
      .returning()
      .execute();

    // Create multiple promotion schedules for the same employee
    const schedules = [
      {
        employee_id: employee.id,
        current_position: 'Junior Developer',
        target_position: 'Mid-level Developer',
        current_salary: '60000',
        target_salary: '75000',
        scheduled_date: new Date('2024-02-01'),
        status: 'completed' as const,
        notes: 'First promotion'
      },
      {
        employee_id: employee.id,
        current_position: 'Mid-level Developer',
        target_position: 'Senior Developer',
        current_salary: '75000',
        target_salary: '95000',
        scheduled_date: new Date('2024-08-01'),
        status: 'pending' as const,
        notes: 'Second promotion planned'
      }
    ];

    await db.insert(promotionScheduleTable)
      .values(schedules)
      .execute();

    const result = await getAllPromotionSchedules();

    expect(result).toHaveLength(2);
    expect(result[0].scheduled_date.getTime()).toBeLessThan(result[1].scheduled_date.getTime());
    expect(result[0].status).toEqual('completed');
    expect(result[1].status).toEqual('pending');
    expect(result[0].employee_id).toEqual(employee.id);
    expect(result[1].employee_id).toEqual(employee.id);
  });

  it('should handle all promotion statuses', async () => {
    // Create test employees
    const employees = await db.insert(employeesTable)
      .values([testEmployee1, testEmployee2])
      .returning()
      .execute();

    // Create promotion schedules with different statuses
    const schedules = [
      {
        employee_id: employees[0].id,
        current_position: 'Junior Developer',
        target_position: 'Senior Developer',
        current_salary: '65000',
        target_salary: '85000',
        scheduled_date: new Date('2024-01-01'),
        status: 'pending' as const,
        notes: 'Pending review'
      },
      {
        employee_id: employees[1].id,
        current_position: 'Marketing Specialist',
        target_position: 'Marketing Manager',
        current_salary: '55000',
        target_salary: '75000',
        scheduled_date: new Date('2024-02-01'),
        status: 'approved' as const,
        notes: 'Approved by management'
      },
      {
        employee_id: employees[0].id,
        current_position: 'Senior Developer',
        target_position: 'Tech Lead',
        current_salary: '85000',
        target_salary: '105000',
        scheduled_date: new Date('2024-03-01'),
        status: 'completed' as const,
        notes: 'Successfully promoted'
      },
      {
        employee_id: employees[1].id,
        current_position: 'Marketing Manager',
        target_position: 'Marketing Director',
        current_salary: '75000',
        target_salary: '95000',
        scheduled_date: new Date('2024-04-01'),
        status: 'cancelled' as const,
        notes: 'Budget constraints'
      }
    ];

    await db.insert(promotionScheduleTable)
      .values(schedules)
      .execute();

    const result = await getAllPromotionSchedules();

    expect(result).toHaveLength(4);
    
    // Verify all statuses are present
    const statuses = result.map(r => r.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('approved');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');
    
    // Verify ordering by scheduled_date
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].scheduled_date.getTime()).toBeLessThanOrEqual(result[i + 1].scheduled_date.getTime());
    }
  });

  it('should verify database records exist after querying', async () => {
    // Create test employee and promotion schedule
    const [employee] = await db.insert(employeesTable)
      .values([testEmployee1])
      .returning()
      .execute();

    const [insertedSchedule] = await db.insert(promotionScheduleTable)
      .values([{
        employee_id: employee.id,
        current_position: 'Junior Developer',
        target_position: 'Senior Developer',
        current_salary: '70000',
        target_salary: '90000',
        scheduled_date: new Date('2024-05-01'),
        status: 'approved',
        notes: 'Ready for promotion'
      }])
      .returning()
      .execute();

    const result = await getAllPromotionSchedules();

    // Verify handler result
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(insertedSchedule.id);

    // Verify record exists in database
    const dbRecords = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, result[0].id))
      .execute();

    expect(dbRecords).toHaveLength(1);
    expect(parseFloat(dbRecords[0].current_salary)).toEqual(70000);
    expect(parseFloat(dbRecords[0].target_salary)).toEqual(90000);
    expect(dbRecords[0].status).toEqual('approved');
  });
});