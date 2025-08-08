import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { promotionHistoryTable, employeesTable } from '../db/schema';
import { type CreatePromotionHistoryInput, type CreateEmployeeInput } from '../schema';
import { createPromotionHistory } from '../handlers/create_promotion_history';
import { eq } from 'drizzle-orm';

// Test employee data
const testEmployee: CreateEmployeeInput = {
  name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@company.com',
  department: 'Engineering',
  position: 'Junior Developer',
  hire_date: new Date('2023-01-15')
};

// Test promotion history input
const testPromotionInput: CreatePromotionHistoryInput = {
  employee_id: 1, // Will be set after employee creation
  previous_position: 'Junior Developer',
  new_position: 'Senior Developer',
  previous_salary: 75000,
  new_salary: 95000,
  promotion_date: new Date('2024-01-15'),
  effective_date: new Date('2024-02-01'),
  notes: 'Promoted for excellent performance'
};

describe('createPromotionHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a promotion history record', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: testEmployee.name,
        employee_id: testEmployee.employee_id,
        email: testEmployee.email,
        department: testEmployee.department,
        position: testEmployee.position,
        hire_date: testEmployee.hire_date
      })
      .returning()
      .execute();

    const employee = employeeResult[0];
    const input = { ...testPromotionInput, employee_id: employee.id };

    const result = await createPromotionHistory(input);

    // Verify basic fields
    expect(result.employee_id).toEqual(employee.id);
    expect(result.previous_position).toEqual('Junior Developer');
    expect(result.new_position).toEqual('Senior Developer');
    expect(result.previous_salary).toEqual(75000);
    expect(typeof result.previous_salary).toBe('number');
    expect(result.new_salary).toEqual(95000);
    expect(typeof result.new_salary).toBe('number');
    expect(result.promotion_date).toEqual(input.promotion_date);
    expect(result.effective_date).toEqual(input.effective_date);
    expect(result.notes).toEqual('Promoted for excellent performance');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save promotion history to database', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: testEmployee.name,
        employee_id: testEmployee.employee_id,
        email: testEmployee.email,
        department: testEmployee.department,
        position: testEmployee.position,
        hire_date: testEmployee.hire_date
      })
      .returning()
      .execute();

    const employee = employeeResult[0];
    const input = { ...testPromotionInput, employee_id: employee.id };

    const result = await createPromotionHistory(input);

    // Query the database to verify record was saved
    const savedRecords = await db.select()
      .from(promotionHistoryTable)
      .where(eq(promotionHistoryTable.id, result.id))
      .execute();

    expect(savedRecords).toHaveLength(1);
    const savedRecord = savedRecords[0];
    expect(savedRecord.employee_id).toEqual(employee.id);
    expect(savedRecord.previous_position).toEqual('Junior Developer');
    expect(savedRecord.new_position).toEqual('Senior Developer');
    expect(parseFloat(savedRecord.previous_salary!)).toEqual(75000);
    expect(parseFloat(savedRecord.new_salary)).toEqual(95000);
    expect(savedRecord.notes).toEqual('Promoted for excellent performance');
    expect(savedRecord.created_at).toBeInstanceOf(Date);
  });

  it('should handle null previous_position and previous_salary for first promotion', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: testEmployee.name,
        employee_id: testEmployee.employee_id,
        email: testEmployee.email,
        department: testEmployee.department,
        position: testEmployee.position,
        hire_date: testEmployee.hire_date
      })
      .returning()
      .execute();

    const employee = employeeResult[0];
    
    // First promotion - no previous position or salary
    const firstPromotionInput: CreatePromotionHistoryInput = {
      employee_id: employee.id,
      previous_position: null,
      new_position: 'Developer',
      previous_salary: null,
      new_salary: 70000,
      promotion_date: new Date('2023-06-15'),
      effective_date: new Date('2023-07-01'),
      notes: 'First promotion from internship'
    };

    const result = await createPromotionHistory(firstPromotionInput);

    expect(result.previous_position).toBeNull();
    expect(result.previous_salary).toBeNull();
    expect(result.new_position).toEqual('Developer');
    expect(result.new_salary).toEqual(70000);
    expect(typeof result.new_salary).toBe('number');
  });

  it('should handle optional notes field', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: testEmployee.name,
        employee_id: testEmployee.employee_id,
        email: testEmployee.email,
        department: testEmployee.department,
        position: testEmployee.position,
        hire_date: testEmployee.hire_date
      })
      .returning()
      .execute();

    const employee = employeeResult[0];
    
    // Promotion without notes
    const inputWithoutNotes: CreatePromotionHistoryInput = {
      employee_id: employee.id,
      previous_position: 'Junior Developer',
      new_position: 'Senior Developer',
      previous_salary: 75000,
      new_salary: 95000,
      promotion_date: new Date('2024-01-15'),
      effective_date: new Date('2024-02-01')
      // notes is optional and not provided
    };

    const result = await createPromotionHistory(inputWithoutNotes);

    expect(result.notes).toBeNull();
    expect(result.new_position).toEqual('Senior Developer');
    expect(result.new_salary).toEqual(95000);
  });

  it('should throw error when employee does not exist', async () => {
    const invalidInput: CreatePromotionHistoryInput = {
      employee_id: 999, // Non-existent employee ID
      previous_position: 'Junior Developer',
      new_position: 'Senior Developer',
      previous_salary: 75000,
      new_salary: 95000,
      promotion_date: new Date('2024-01-15'),
      effective_date: new Date('2024-02-01'),
      notes: 'This should fail'
    };

    await expect(createPromotionHistory(invalidInput))
      .rejects
      .toThrow(/Employee with ID 999 not found/i);
  });

  it('should handle different promotion scenarios', async () => {
    // Create employee first
    const employeeResult = await db.insert(employeesTable)
      .values({
        name: testEmployee.name,
        employee_id: testEmployee.employee_id,
        email: testEmployee.email,
        department: testEmployee.department,
        position: testEmployee.position,
        hire_date: testEmployee.hire_date
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Test multiple promotions for the same employee
    const promotions = [
      {
        employee_id: employee.id,
        previous_position: null,
        new_position: 'Junior Developer',
        previous_salary: null,
        new_salary: 65000,
        promotion_date: new Date('2023-06-15'),
        effective_date: new Date('2023-07-01'),
        notes: 'Initial promotion from intern'
      },
      {
        employee_id: employee.id,
        previous_position: 'Junior Developer',
        new_position: 'Senior Developer',
        previous_salary: 65000,
        new_salary: 85000,
        promotion_date: new Date('2024-01-15'),
        effective_date: new Date('2024-02-01'),
        notes: 'Annual promotion'
      }
    ];

    for (const promotion of promotions) {
      const result = await createPromotionHistory(promotion);
      expect(result.employee_id).toEqual(employee.id);
      expect(result.new_position).toEqual(promotion.new_position);
      expect(result.new_salary).toEqual(promotion.new_salary);
      expect(typeof result.new_salary).toBe('number');
    }

    // Verify both records were created
    const allPromotions = await db.select()
      .from(promotionHistoryTable)
      .where(eq(promotionHistoryTable.employee_id, employee.id))
      .execute();

    expect(allPromotions).toHaveLength(2);
  });
});