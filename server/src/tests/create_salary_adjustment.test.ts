import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryAdjustmentsTable, employeesTable } from '../db/schema';
import { type CreateSalaryAdjustmentInput } from '../schema';
import { createSalaryAdjustment } from '../handlers/create_salary_adjustment';
import { eq } from 'drizzle-orm';

// Test employee data
const testEmployee = {
  name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@company.com',
  department: 'Engineering',
  position: 'Software Engineer',
  hire_date: new Date('2020-01-15')
};

// Test salary adjustment input
const testInput: CreateSalaryAdjustmentInput = {
  employee_id: 1,
  previous_salary: 75000,
  new_salary: 80000,
  adjustment_type: 'annual_increase',
  adjustment_percentage: 6.67,
  effective_date: new Date('2024-01-01'),
  notes: 'Annual performance increase'
};

describe('createSalaryAdjustment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a salary adjustment with all fields', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];
    const adjustmentInput = { ...testInput, employee_id: employee.id };

    const result = await createSalaryAdjustment(adjustmentInput);

    // Validate all fields
    expect(result.employee_id).toEqual(employee.id);
    expect(result.previous_salary).toEqual(75000);
    expect(result.new_salary).toEqual(80000);
    expect(result.adjustment_type).toEqual('annual_increase');
    expect(result.adjustment_percentage).toEqual(6.67);
    expect(result.effective_date).toEqual(new Date('2024-01-01'));
    expect(result.notes).toEqual('Annual performance increase');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.previous_salary).toBe('number');
    expect(typeof result.new_salary).toBe('number');
    expect(typeof result.adjustment_percentage).toBe('number');
  });

  it('should calculate adjustment percentage automatically when not provided', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];
    const adjustmentInput = {
      employee_id: employee.id,
      previous_salary: 100000,
      new_salary: 110000,
      adjustment_type: 'performance' as const,
      effective_date: new Date('2024-01-01'),
      notes: 'Performance bonus'
    };

    const result = await createSalaryAdjustment(adjustmentInput);

    // Should calculate 10% increase
    expect(result.adjustment_percentage).toEqual(10);
    expect(result.previous_salary).toEqual(100000);
    expect(result.new_salary).toEqual(110000);
    expect(result.adjustment_type).toEqual('performance');
  });

  it('should handle negative adjustment percentage', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];
    const adjustmentInput = {
      employee_id: employee.id,
      previous_salary: 100000,
      new_salary: 90000,
      adjustment_type: 'other' as const,
      effective_date: new Date('2024-01-01'),
      notes: 'Salary reduction'
    };

    const result = await createSalaryAdjustment(adjustmentInput);

    // Should calculate -10% decrease
    expect(result.adjustment_percentage).toEqual(-10);
    expect(result.previous_salary).toEqual(100000);
    expect(result.new_salary).toEqual(90000);
  });

  it('should handle null adjustment percentage when previous salary is zero', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];
    const adjustmentInput = {
      employee_id: employee.id,
      previous_salary: 0,
      new_salary: 50000,
      adjustment_type: 'promotion' as const,
      effective_date: new Date('2024-01-01'),
      notes: 'First salary for intern promotion'
    };

    const result = await createSalaryAdjustment(adjustmentInput);

    // Should set percentage to null when previous salary is 0
    expect(result.adjustment_percentage).toBeNull();
    expect(result.previous_salary).toEqual(0);
    expect(result.new_salary).toEqual(50000);
  });

  it('should create salary adjustment without optional fields', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];
    const minimalInput = {
      employee_id: employee.id,
      previous_salary: 60000,
      new_salary: 65000,
      adjustment_type: 'annual_increase' as const,
      effective_date: new Date('2024-01-01')
    };

    const result = await createSalaryAdjustment(minimalInput);

    expect(result.employee_id).toEqual(employee.id);
    expect(result.previous_salary).toEqual(60000);
    expect(result.new_salary).toEqual(65000);
    expect(result.adjustment_type).toEqual('annual_increase');
    expect(result.adjustment_percentage).toEqual(8.33); // Auto-calculated
    expect(result.effective_date).toEqual(new Date('2024-01-01'));
    expect(result.notes).toBeNull();
  });

  it('should save salary adjustment to database', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];
    const adjustmentInput = { ...testInput, employee_id: employee.id };

    const result = await createSalaryAdjustment(adjustmentInput);

    // Query the database to verify the record was saved
    const adjustments = await db.select()
      .from(salaryAdjustmentsTable)
      .where(eq(salaryAdjustmentsTable.id, result.id))
      .execute();

    expect(adjustments).toHaveLength(1);
    const savedAdjustment = adjustments[0];
    expect(savedAdjustment.employee_id).toEqual(employee.id);
    expect(parseFloat(savedAdjustment.previous_salary)).toEqual(75000);
    expect(parseFloat(savedAdjustment.new_salary)).toEqual(80000);
    expect(savedAdjustment.adjustment_type).toEqual('annual_increase');
    expect(parseFloat(savedAdjustment.adjustment_percentage!)).toEqual(6.67);
    expect(savedAdjustment.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when employee does not exist', async () => {
    const nonExistentEmployeeInput = {
      ...testInput,
      employee_id: 999 // Non-existent employee ID
    };

    await expect(createSalaryAdjustment(nonExistentEmployeeInput))
      .rejects.toThrow(/Employee with id 999 not found/i);
  });

  it('should handle different adjustment types correctly', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();
    
    const employee = employeeResult[0];

    const adjustmentTypes = ['annual_increase', 'promotion', 'performance', 'other'] as const;

    for (const adjustmentType of adjustmentTypes) {
      const adjustmentInput = {
        employee_id: employee.id,
        previous_salary: 70000,
        new_salary: 75000,
        adjustment_type: adjustmentType,
        effective_date: new Date('2024-01-01'),
        notes: `Test ${adjustmentType} adjustment`
      };

      const result = await createSalaryAdjustment(adjustmentInput);
      expect(result.adjustment_type).toEqual(adjustmentType);
      expect(result.adjustment_percentage).toEqual(7.14); // Auto-calculated
    }
  });
});