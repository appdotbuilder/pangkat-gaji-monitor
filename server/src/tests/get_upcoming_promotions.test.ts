import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, promotionScheduleTable } from '../db/schema';
import { type GetUpcomingPromotionsInput } from '../schema';
import { getUpcomingPromotions } from '../handlers/get_upcoming_promotions';

// Test input with default value
const testInput: GetUpcomingPromotionsInput = {
  days_ahead: 30
};

describe('getUpcomingPromotions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return upcoming promotions within timeframe', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Senior Developer',
        hire_date: new Date('2022-01-15')
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create promotion scheduled within the timeframe (15 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    await db.insert(promotionScheduleTable)
      .values({
        employee_id: employee.id,
        current_position: 'Senior Developer',
        target_position: 'Lead Developer',
        current_salary: '75000.00',
        target_salary: '90000.00',
        scheduled_date: futureDate,
        status: 'pending',
        notes: 'Promotion due to excellent performance'
      })
      .execute();

    const result = await getUpcomingPromotions(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual(employee.id);
    expect(result[0].current_position).toEqual('Senior Developer');
    expect(result[0].target_position).toEqual('Lead Developer');
    expect(result[0].current_salary).toEqual(75000);
    expect(result[0].target_salary).toEqual(90000);
    expect(result[0].status).toEqual('pending');
    expect(result[0].notes).toEqual('Promotion due to excellent performance');
    expect(typeof result[0].current_salary).toBe('number');
    expect(typeof result[0].target_salary).toBe('number');
    expect(result[0].scheduled_date).toBeInstanceOf(Date);
  });

  it('should include approved promotions', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'Jane Smith',
        employee_id: 'EMP002',
        email: 'jane.smith@company.com',
        department: 'Marketing',
        position: 'Marketing Manager',
        hire_date: new Date('2021-03-10')
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create approved promotion within timeframe
    const approvedDate = new Date();
    approvedDate.setDate(approvedDate.getDate() + 10);

    await db.insert(promotionScheduleTable)
      .values({
        employee_id: employee.id,
        current_position: 'Marketing Manager',
        target_position: 'Senior Marketing Manager',
        current_salary: '80000.00',
        target_salary: '95000.00',
        scheduled_date: approvedDate,
        status: 'approved',
        notes: null
      })
      .execute();

    const result = await getUpcomingPromotions(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('approved');
    expect(result[0].notes).toBeNull();
  });

  it('should exclude completed promotions', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'Bob Johnson',
        employee_id: 'EMP003',
        email: 'bob.johnson@company.com',
        department: 'Sales',
        position: 'Sales Associate',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create completed promotion (should be excluded)
    const completedDate = new Date();
    completedDate.setDate(completedDate.getDate() + 5);

    await db.insert(promotionScheduleTable)
      .values({
        employee_id: employee.id,
        current_position: 'Sales Associate',
        target_position: 'Senior Sales Associate',
        current_salary: '50000.00',
        target_salary: '60000.00',
        scheduled_date: completedDate,
        status: 'completed',
        notes: 'Promotion already processed'
      })
      .execute();

    const result = await getUpcomingPromotions(testInput);

    expect(result).toHaveLength(0);
  });

  it('should exclude cancelled promotions', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'Alice Brown',
        employee_id: 'EMP004',
        email: 'alice.brown@company.com',
        department: 'HR',
        position: 'HR Specialist',
        hire_date: new Date('2022-06-15')
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create cancelled promotion (should be excluded)
    const cancelledDate = new Date();
    cancelledDate.setDate(cancelledDate.getDate() + 20);

    await db.insert(promotionScheduleTable)
      .values({
        employee_id: employee.id,
        current_position: 'HR Specialist',
        target_position: 'HR Manager',
        current_salary: '65000.00',
        target_salary: '80000.00',
        scheduled_date: cancelledDate,
        status: 'cancelled',
        notes: 'Promotion cancelled due to budget constraints'
      })
      .execute();

    const result = await getUpcomingPromotions(testInput);

    expect(result).toHaveLength(0);
  });

  it('should exclude promotions beyond the timeframe', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'Charlie Davis',
        employee_id: 'EMP005',
        email: 'charlie.davis@company.com',
        department: 'Finance',
        position: 'Financial Analyst',
        hire_date: new Date('2023-02-01')
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create promotion beyond 30 days (should be excluded)
    const farFutureDate = new Date();
    farFutureDate.setDate(farFutureDate.getDate() + 45);

    await db.insert(promotionScheduleTable)
      .values({
        employee_id: employee.id,
        current_position: 'Financial Analyst',
        target_position: 'Senior Financial Analyst',
        current_salary: '70000.00',
        target_salary: '85000.00',
        scheduled_date: farFutureDate,
        status: 'pending',
        notes: 'Future promotion'
      })
      .execute();

    const result = await getUpcomingPromotions(testInput);

    expect(result).toHaveLength(0);
  });

  it('should work with custom days_ahead parameter', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: 'David Wilson',
        employee_id: 'EMP006',
        email: 'david.wilson@company.com',
        department: 'IT',
        position: 'System Admin',
        hire_date: new Date('2022-09-01')
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create promotion 45 days out
    const customDate = new Date();
    customDate.setDate(customDate.getDate() + 45);

    await db.insert(promotionScheduleTable)
      .values({
        employee_id: employee.id,
        current_position: 'System Admin',
        target_position: 'Senior System Admin',
        current_salary: '68000.00',
        target_salary: '78000.00',
        scheduled_date: customDate,
        status: 'approved',
        notes: 'Long-term promotion plan'
      })
      .execute();

    // Test with 60 days ahead (should include the promotion)
    const customInput: GetUpcomingPromotionsInput = { days_ahead: 60 };
    const result = await getUpcomingPromotions(customInput);

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual(employee.id);

    // Test with 30 days ahead (should exclude the promotion)
    const defaultResult = await getUpcomingPromotions(testInput);
    expect(defaultResult).toHaveLength(0);
  });

  it('should return multiple upcoming promotions', async () => {
    // Create multiple test employees
    const employee1Result = await db.insert(employeesTable)
      .values({
        name: 'Employee One',
        employee_id: 'EMP007',
        email: 'emp1@company.com',
        department: 'Engineering',
        position: 'Developer',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const employee2Result = await db.insert(employeesTable)
      .values({
        name: 'Employee Two',
        employee_id: 'EMP008',
        email: 'emp2@company.com',
        department: 'Marketing',
        position: 'Coordinator',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const employee1 = employee1Result[0];
    const employee2 = employee2Result[0];

    // Create multiple promotions within timeframe
    const date1 = new Date();
    date1.setDate(date1.getDate() + 10);

    const date2 = new Date();
    date2.setDate(date2.getDate() + 25);

    await db.insert(promotionScheduleTable)
      .values([
        {
          employee_id: employee1.id,
          current_position: 'Developer',
          target_position: 'Senior Developer',
          current_salary: '70000.00',
          target_salary: '85000.00',
          scheduled_date: date1,
          status: 'pending',
          notes: 'First promotion'
        },
        {
          employee_id: employee2.id,
          current_position: 'Coordinator',
          target_position: 'Manager',
          current_salary: '55000.00',
          target_salary: '70000.00',
          scheduled_date: date2,
          status: 'approved',
          notes: 'Second promotion'
        }
      ])
      .execute();

    const result = await getUpcomingPromotions(testInput);

    expect(result).toHaveLength(2);
    
    // Verify both promotions are returned
    const employeeIds = result.map(p => p.employee_id);
    expect(employeeIds).toContain(employee1.id);
    expect(employeeIds).toContain(employee2.id);
  });

  it('should handle empty result set', async () => {
    // Don't create any promotions
    const result = await getUpcomingPromotions(testInput);
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});