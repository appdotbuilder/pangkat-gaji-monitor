import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, salaryAdjustmentsTable } from '../db/schema';
import { type GetSalaryAdjustmentsByEmployeeInput } from '../schema';
import { getSalaryAdjustmentsByEmployee } from '../handlers/get_salary_adjustments_by_employee';

describe('getSalaryAdjustmentsByEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when employee has no salary adjustments', async () => {
    // Create an employee first
    const employee = await db.insert(employeesTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Developer',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const input: GetSalaryAdjustmentsByEmployeeInput = {
      employee_id: employee[0].id
    };

    const result = await getSalaryAdjustmentsByEmployee(input);

    expect(result).toEqual([]);
  });

  it('should return salary adjustments for a specific employee', async () => {
    // Create an employee
    const employee = await db.insert(employeesTable)
      .values({
        name: 'Jane Smith',
        employee_id: 'EMP002',
        email: 'jane.smith@company.com',
        department: 'Marketing',
        position: 'Manager',
        hire_date: new Date('2022-01-01')
      })
      .returning()
      .execute();

    // Create salary adjustments
    const adjustments = await db.insert(salaryAdjustmentsTable)
      .values([
        {
          employee_id: employee[0].id,
          previous_salary: '60000.00',
          new_salary: '65000.00',
          adjustment_type: 'annual_increase',
          adjustment_percentage: '8.33',
          effective_date: new Date('2023-01-01'),
          notes: 'Annual salary review'
        },
        {
          employee_id: employee[0].id,
          previous_salary: '65000.00',
          new_salary: '70000.00',
          adjustment_type: 'promotion',
          adjustment_percentage: '7.69',
          effective_date: new Date('2023-06-01'),
          notes: 'Promotion to Senior Manager'
        }
      ])
      .returning()
      .execute();

    const input: GetSalaryAdjustmentsByEmployeeInput = {
      employee_id: employee[0].id
    };

    const result = await getSalaryAdjustmentsByEmployee(input);

    expect(result).toHaveLength(2);

    // Check that results are ordered by effective_date (most recent first)
    expect(result[0].effective_date.getTime()).toBeGreaterThan(result[1].effective_date.getTime());

    // Check first adjustment (most recent)
    expect(result[0].previous_salary).toBe(65000);
    expect(result[0].new_salary).toBe(70000);
    expect(result[0].adjustment_type).toBe('promotion');
    expect(result[0].adjustment_percentage).toBe(7.69);
    expect(result[0].notes).toBe('Promotion to Senior Manager');
    expect(result[0].effective_date).toEqual(new Date('2023-06-01'));

    // Check second adjustment (older)
    expect(result[1].previous_salary).toBe(60000);
    expect(result[1].new_salary).toBe(65000);
    expect(result[1].adjustment_type).toBe('annual_increase');
    expect(result[1].adjustment_percentage).toBe(8.33);
    expect(result[1].notes).toBe('Annual salary review');
    expect(result[1].effective_date).toEqual(new Date('2023-01-01'));

    // Check that numeric fields are properly converted
    expect(typeof result[0].previous_salary).toBe('number');
    expect(typeof result[0].new_salary).toBe('number');
    expect(typeof result[0].adjustment_percentage).toBe('number');
  });

  it('should handle null adjustment_percentage correctly', async () => {
    // Create an employee
    const employee = await db.insert(employeesTable)
      .values({
        name: 'Bob Wilson',
        employee_id: 'EMP003',
        email: 'bob.wilson@company.com',
        department: 'HR',
        position: 'Coordinator',
        hire_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    // Create salary adjustment without percentage
    await db.insert(salaryAdjustmentsTable)
      .values({
        employee_id: employee[0].id,
        previous_salary: '50000.00',
        new_salary: '52000.00',
        adjustment_type: 'other',
        adjustment_percentage: null,
        effective_date: new Date('2023-03-01'),
        notes: 'Market adjustment'
      })
      .execute();

    const input: GetSalaryAdjustmentsByEmployeeInput = {
      employee_id: employee[0].id
    };

    const result = await getSalaryAdjustmentsByEmployee(input);

    expect(result).toHaveLength(1);
    expect(result[0].adjustment_percentage).toBeNull();
    expect(result[0].previous_salary).toBe(50000);
    expect(result[0].new_salary).toBe(52000);
    expect(result[0].adjustment_type).toBe('other');
  });

  it('should only return adjustments for the specified employee', async () => {
    // Create two employees
    const employees = await db.insert(employeesTable)
      .values([
        {
          name: 'Alice Johnson',
          employee_id: 'EMP004',
          email: 'alice.johnson@company.com',
          department: 'Finance',
          position: 'Analyst',
          hire_date: new Date('2022-01-01')
        },
        {
          name: 'Charlie Brown',
          employee_id: 'EMP005',
          email: 'charlie.brown@company.com',
          department: 'Finance',
          position: 'Senior Analyst',
          hire_date: new Date('2021-01-01')
        }
      ])
      .returning()
      .execute();

    // Create salary adjustments for both employees
    await db.insert(salaryAdjustmentsTable)
      .values([
        {
          employee_id: employees[0].id,
          previous_salary: '55000.00',
          new_salary: '60000.00',
          adjustment_type: 'performance',
          effective_date: new Date('2023-04-01')
        },
        {
          employee_id: employees[1].id,
          previous_salary: '70000.00',
          new_salary: '75000.00',
          adjustment_type: 'annual_increase',
          effective_date: new Date('2023-04-01')
        }
      ])
      .execute();

    const input: GetSalaryAdjustmentsByEmployeeInput = {
      employee_id: employees[0].id
    };

    const result = await getSalaryAdjustmentsByEmployee(input);

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toBe(employees[0].id);
    expect(result[0].previous_salary).toBe(55000);
    expect(result[0].new_salary).toBe(60000);
  });

  it('should return multiple adjustments in correct chronological order', async () => {
    // Create an employee
    const employee = await db.insert(employeesTable)
      .values({
        name: 'David Miller',
        employee_id: 'EMP006',
        email: 'david.miller@company.com',
        department: 'Operations',
        position: 'Specialist',
        hire_date: new Date('2021-01-01')
      })
      .returning()
      .execute();

    // Create multiple salary adjustments with different dates
    await db.insert(salaryAdjustmentsTable)
      .values([
        {
          employee_id: employee[0].id,
          previous_salary: '45000.00',
          new_salary: '48000.00',
          adjustment_type: 'annual_increase',
          effective_date: new Date('2022-01-01'),
          notes: '2022 increase'
        },
        {
          employee_id: employee[0].id,
          previous_salary: '51000.00',
          new_salary: '55000.00',
          adjustment_type: 'promotion',
          effective_date: new Date('2023-08-01'),
          notes: '2023 promotion'
        },
        {
          employee_id: employee[0].id,
          previous_salary: '48000.00',
          new_salary: '51000.00',
          adjustment_type: 'performance',
          effective_date: new Date('2023-01-01'),
          notes: '2023 performance'
        }
      ])
      .execute();

    const input: GetSalaryAdjustmentsByEmployeeInput = {
      employee_id: employee[0].id
    };

    const result = await getSalaryAdjustmentsByEmployee(input);

    expect(result).toHaveLength(3);

    // Verify chronological order (most recent first)
    expect(result[0].effective_date).toEqual(new Date('2023-08-01'));
    expect(result[0].notes).toBe('2023 promotion');

    expect(result[1].effective_date).toEqual(new Date('2023-01-01'));
    expect(result[1].notes).toBe('2023 performance');

    expect(result[2].effective_date).toEqual(new Date('2022-01-01'));
    expect(result[2].notes).toBe('2022 increase');
  });
});