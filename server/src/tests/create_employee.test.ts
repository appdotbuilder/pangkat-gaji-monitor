import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput } from '../schema';
import { createEmployee } from '../handlers/create_employee';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateEmployeeInput = {
  name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@company.com',
  department: 'Engineering',
  position: 'Software Developer',
  hire_date: new Date('2024-01-15')
};

describe('createEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an employee', async () => {
    const result = await createEmployee(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('John Doe');
    expect(result.employee_id).toEqual('EMP001');
    expect(result.email).toEqual('john.doe@company.com');
    expect(result.department).toEqual('Engineering');
    expect(result.position).toEqual('Software Developer');
    expect(result.hire_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save employee to database', async () => {
    const result = await createEmployee(testInput);

    // Query database to verify the employee was saved
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(employees).toHaveLength(1);
    expect(employees[0].name).toEqual('John Doe');
    expect(employees[0].employee_id).toEqual('EMP001');
    expect(employees[0].email).toEqual('john.doe@company.com');
    expect(employees[0].department).toEqual('Engineering');
    expect(employees[0].position).toEqual('Software Developer');
    expect(employees[0].hire_date).toEqual(new Date('2024-01-15'));
    expect(employees[0].created_at).toBeInstanceOf(Date);
    expect(employees[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique employee_id constraint', async () => {
    // Create first employee
    await createEmployee(testInput);

    // Try to create another employee with the same employee_id
    const duplicateInput: CreateEmployeeInput = {
      ...testInput,
      name: 'Jane Smith',
      email: 'jane.smith@company.com'
    };

    // Should throw error due to unique constraint violation
    await expect(createEmployee(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should enforce unique email constraint', async () => {
    // Create first employee
    await createEmployee(testInput);

    // Try to create another employee with the same email
    const duplicateInput: CreateEmployeeInput = {
      ...testInput,
      name: 'Jane Smith',
      employee_id: 'EMP002'
    };

    // Should throw error due to unique constraint violation
    await expect(createEmployee(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple employees with different data', async () => {
    // Create first employee
    const employee1 = await createEmployee(testInput);

    // Create second employee with different data
    const input2: CreateEmployeeInput = {
      name: 'Jane Smith',
      employee_id: 'EMP002',
      email: 'jane.smith@company.com',
      department: 'Marketing',
      position: 'Marketing Manager',
      hire_date: new Date('2024-02-01')
    };

    const employee2 = await createEmployee(input2);

    // Verify both employees were created successfully
    expect(employee1.id).not.toEqual(employee2.id);
    expect(employee1.employee_id).toEqual('EMP001');
    expect(employee2.employee_id).toEqual('EMP002');

    // Verify database contains both employees
    const allEmployees = await db.select()
      .from(employeesTable)
      .execute();

    expect(allEmployees).toHaveLength(2);
    
    // Find employees by employee_id
    const emp1 = allEmployees.find(e => e.employee_id === 'EMP001');
    const emp2 = allEmployees.find(e => e.employee_id === 'EMP002');
    
    expect(emp1).toBeDefined();
    expect(emp1!.name).toEqual('John Doe');
    expect(emp1!.department).toEqual('Engineering');
    
    expect(emp2).toBeDefined();
    expect(emp2!.name).toEqual('Jane Smith');
    expect(emp2!.department).toEqual('Marketing');
  });

  it('should handle date values correctly', async () => {
    const dateInput: CreateEmployeeInput = {
      name: 'Test Employee',
      employee_id: 'EMP999',
      email: 'test@company.com',
      department: 'HR',
      position: 'HR Specialist',
      hire_date: new Date('2023-12-01T10:00:00.000Z')
    };

    const result = await createEmployee(dateInput);

    // Verify hire_date is stored and retrieved correctly
    expect(result.hire_date).toBeInstanceOf(Date);
    expect(result.hire_date).toEqual(new Date('2023-12-01T10:00:00.000Z'));

    // Verify from database
    const dbEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(dbEmployee[0].hire_date).toBeInstanceOf(Date);
    expect(dbEmployee[0].hire_date).toEqual(new Date('2023-12-01T10:00:00.000Z'));
  });
});