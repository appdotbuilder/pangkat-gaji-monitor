import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, promotionHistoryTable } from '../db/schema';
import { type GetPromotionHistoryByEmployeeInput } from '../schema';
import { getPromotionHistoryByEmployee } from '../handlers/get_promotion_history_by_employee';

describe('getPromotionHistoryByEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for employee with no promotion history', async () => {
    // Create an employee first
    const employee = await db.insert(employeesTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001',
        email: 'john@company.com',
        department: 'Engineering',
        position: 'Software Engineer',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const input: GetPromotionHistoryByEmployeeInput = {
      employee_id: employee[0].id
    };

    const result = await getPromotionHistoryByEmployee(input);

    expect(result).toEqual([]);
  });

  it('should return promotion history for employee ordered by promotion_date desc', async () => {
    // Create an employee first
    const employee = await db.insert(employeesTable)
      .values({
        name: 'Jane Smith',
        employee_id: 'EMP002',
        email: 'jane@company.com',
        department: 'Engineering',
        position: 'Senior Software Engineer',
        hire_date: new Date('2022-01-01')
      })
      .returning()
      .execute();

    const employeeId = employee[0].id;

    // Create multiple promotion history records with different dates
    await db.insert(promotionHistoryTable)
      .values([
        {
          employee_id: employeeId,
          previous_position: 'Software Engineer',
          new_position: 'Senior Software Engineer',
          previous_salary: '80000.00',
          new_salary: '100000.00',
          promotion_date: new Date('2023-01-15'),
          effective_date: new Date('2023-02-01'),
          notes: 'Performance based promotion'
        },
        {
          employee_id: employeeId,
          previous_position: 'Senior Software Engineer',
          new_position: 'Lead Software Engineer',
          previous_salary: '100000.00',
          new_salary: '120000.00',
          promotion_date: new Date('2024-01-15'),
          effective_date: new Date('2024-02-01'),
          notes: 'Leadership role promotion'
        },
        {
          employee_id: employeeId,
          previous_position: 'Junior Developer',
          new_position: 'Software Engineer',
          previous_salary: '65000.00',
          new_salary: '80000.00',
          promotion_date: new Date('2022-06-15'),
          effective_date: new Date('2022-07-01'),
          notes: 'First promotion'
        }
      ])
      .execute();

    const input: GetPromotionHistoryByEmployeeInput = {
      employee_id: employeeId
    };

    const result = await getPromotionHistoryByEmployee(input);

    expect(result).toHaveLength(3);

    // Verify ordering by promotion_date (most recent first)
    expect(result[0].promotion_date).toEqual(new Date('2024-01-15'));
    expect(result[1].promotion_date).toEqual(new Date('2023-01-15'));
    expect(result[2].promotion_date).toEqual(new Date('2022-06-15'));

    // Verify numeric field conversions
    expect(typeof result[0].new_salary).toBe('number');
    expect(result[0].new_salary).toEqual(120000);
    expect(result[0].previous_salary).toEqual(100000);

    // Verify all field values for most recent promotion
    expect(result[0].previous_position).toEqual('Senior Software Engineer');
    expect(result[0].new_position).toEqual('Lead Software Engineer');
    expect(result[0].effective_date).toEqual(new Date('2024-02-01'));
    expect(result[0].notes).toEqual('Leadership role promotion');
    expect(result[0].employee_id).toEqual(employeeId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create an employee first
    const employee = await db.insert(employeesTable)
      .values({
        name: 'Bob Wilson',
        employee_id: 'EMP003',
        email: 'bob@company.com',
        department: 'Marketing',
        position: 'Marketing Manager',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const employeeId = employee[0].id;

    // Create promotion history with null previous_position and previous_salary (first job)
    await db.insert(promotionHistoryTable)
      .values({
        employee_id: employeeId,
        previous_position: null,
        new_position: 'Marketing Coordinator',
        previous_salary: null,
        new_salary: '50000.00',
        promotion_date: new Date('2023-01-15'),
        effective_date: new Date('2023-01-15'),
        notes: null
      })
      .execute();

    const input: GetPromotionHistoryByEmployeeInput = {
      employee_id: employeeId
    };

    const result = await getPromotionHistoryByEmployee(input);

    expect(result).toHaveLength(1);
    expect(result[0].previous_position).toBeNull();
    expect(result[0].previous_salary).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].new_position).toEqual('Marketing Coordinator');
    expect(result[0].new_salary).toEqual(50000);
    expect(typeof result[0].new_salary).toBe('number');
  });

  it('should return empty array for non-existent employee', async () => {
    const input: GetPromotionHistoryByEmployeeInput = {
      employee_id: 99999 // Non-existent employee ID
    };

    const result = await getPromotionHistoryByEmployee(input);

    expect(result).toEqual([]);
  });

  it('should only return promotion history for the specified employee', async () => {
    // Create two employees
    const employee1 = await db.insert(employeesTable)
      .values({
        name: 'Alice Johnson',
        employee_id: 'EMP004',
        email: 'alice@company.com',
        department: 'Engineering',
        position: 'Software Engineer',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const employee2 = await db.insert(employeesTable)
      .values({
        name: 'Charlie Brown',
        employee_id: 'EMP005',
        email: 'charlie@company.com',
        department: 'Engineering',
        position: 'Software Engineer',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const employee1Id = employee1[0].id;
    const employee2Id = employee2[0].id;

    // Create promotion history for both employees
    await db.insert(promotionHistoryTable)
      .values([
        {
          employee_id: employee1Id,
          previous_position: 'Junior Developer',
          new_position: 'Software Engineer',
          previous_salary: '60000.00',
          new_salary: '80000.00',
          promotion_date: new Date('2023-06-15'),
          effective_date: new Date('2023-07-01'),
          notes: 'Employee 1 promotion'
        },
        {
          employee_id: employee2Id,
          previous_position: 'Junior Developer',
          new_position: 'Software Engineer',
          previous_salary: '60000.00',
          new_salary: '80000.00',
          promotion_date: new Date('2023-06-15'),
          effective_date: new Date('2023-07-01'),
          notes: 'Employee 2 promotion'
        }
      ])
      .execute();

    const input: GetPromotionHistoryByEmployeeInput = {
      employee_id: employee1Id
    };

    const result = await getPromotionHistoryByEmployee(input);

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual(employee1Id);
    expect(result[0].notes).toEqual('Employee 1 promotion');
  });
});