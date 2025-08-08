import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type GetEmployeeByIdInput, type CreateEmployeeInput } from '../schema';
import { getEmployeeById } from '../handlers/get_employee_by_id';

// Test employee data
const testEmployee: CreateEmployeeInput = {
  name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@company.com',
  department: 'Engineering',
  position: 'Software Engineer',
  hire_date: new Date('2023-01-15')
};

describe('getEmployeeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return employee when found by ID', async () => {
    // Create test employee
    const insertResult = await db.insert(employeesTable)
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

    const createdEmployee = insertResult[0];

    // Test input
    const input: GetEmployeeByIdInput = {
      id: createdEmployee.id
    };

    // Execute handler
    const result = await getEmployeeById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdEmployee.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.employee_id).toEqual('EMP001');
    expect(result!.email).toEqual('john.doe@company.com');
    expect(result!.department).toEqual('Engineering');
    expect(result!.position).toEqual('Software Engineer');
    expect(result!.hire_date).toBeInstanceOf(Date);
    expect(result!.hire_date).toEqual(testEmployee.hire_date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when employee not found', async () => {
    // Test with non-existent ID
    const input: GetEmployeeByIdInput = {
      id: 999999
    };

    // Execute handler
    const result = await getEmployeeById(input);

    // Verify result is null
    expect(result).toBeNull();
  });

  it('should handle multiple employees and return correct one', async () => {
    // Create multiple test employees
    const employee1 = await db.insert(employeesTable)
      .values({
        name: 'Alice Smith',
        employee_id: 'EMP002',
        email: 'alice.smith@company.com',
        department: 'Marketing',
        position: 'Marketing Manager',
        hire_date: new Date('2022-03-10')
      })
      .returning()
      .execute();

    const employee2 = await db.insert(employeesTable)
      .values({
        name: 'Bob Johnson',
        employee_id: 'EMP003',
        email: 'bob.johnson@company.com',
        department: 'Sales',
        position: 'Sales Representative',
        hire_date: new Date('2023-06-20')
      })
      .returning()
      .execute();

    // Test retrieving second employee
    const input: GetEmployeeByIdInput = {
      id: employee2[0].id
    };

    const result = await getEmployeeById(input);

    // Verify correct employee is returned
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(employee2[0].id);
    expect(result!.name).toEqual('Bob Johnson');
    expect(result!.employee_id).toEqual('EMP003');
    expect(result!.email).toEqual('bob.johnson@company.com');
    expect(result!.department).toEqual('Sales');
    expect(result!.position).toEqual('Sales Representative');
  });

  it('should return employee with correct date types', async () => {
    // Create employee with specific dates
    const hireDate = new Date('2023-02-15');
    
    const insertResult = await db.insert(employeesTable)
      .values({
        name: 'Jane Wilson',
        employee_id: 'EMP004',
        email: 'jane.wilson@company.com',
        department: 'HR',
        position: 'HR Specialist',
        hire_date: hireDate
      })
      .returning()
      .execute();

    const input: GetEmployeeByIdInput = {
      id: insertResult[0].id
    };

    const result = await getEmployeeById(input);

    // Verify date handling
    expect(result).not.toBeNull();
    expect(result!.hire_date).toBeInstanceOf(Date);
    expect(result!.hire_date.getFullYear()).toEqual(2023);
    expect(result!.hire_date.getMonth()).toEqual(1); // February is month 1
    expect(result!.hire_date.getDate()).toEqual(15);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});