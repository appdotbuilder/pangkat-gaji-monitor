import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput } from '../schema';
import { getEmployees } from '../handlers/get_employees';

// Test employee data
const testEmployee1: CreateEmployeeInput = {
  name: 'John Doe',
  employee_id: 'EMP001',
  email: 'john.doe@company.com',
  department: 'Engineering',
  position: 'Software Engineer',
  hire_date: new Date('2023-01-15')
};

const testEmployee2: CreateEmployeeInput = {
  name: 'Jane Smith',
  employee_id: 'EMP002',
  email: 'jane.smith@company.com',
  department: 'Marketing',
  position: 'Marketing Manager',
  hire_date: new Date('2022-06-10')
};

const testEmployee3: CreateEmployeeInput = {
  name: 'Bob Johnson',
  employee_id: 'EMP003',
  email: 'bob.johnson@company.com',
  department: 'Engineering',
  position: 'Senior Developer',
  hire_date: new Date('2021-03-20')
};

describe('getEmployees', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no employees exist', async () => {
    const result = await getEmployees();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all employees from database', async () => {
    // Create test employees
    await db.insert(employeesTable)
      .values([
        {
          name: testEmployee1.name,
          employee_id: testEmployee1.employee_id,
          email: testEmployee1.email,
          department: testEmployee1.department,
          position: testEmployee1.position,
          hire_date: testEmployee1.hire_date
        },
        {
          name: testEmployee2.name,
          employee_id: testEmployee2.employee_id,
          email: testEmployee2.email,
          department: testEmployee2.department,
          position: testEmployee2.position,
          hire_date: testEmployee2.hire_date
        },
        {
          name: testEmployee3.name,
          employee_id: testEmployee3.employee_id,
          email: testEmployee3.email,
          department: testEmployee3.department,
          position: testEmployee3.position,
          hire_date: testEmployee3.hire_date
        }
      ])
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(3);

    // Verify all employees are returned
    const employeeIds = result.map(emp => emp.employee_id).sort();
    expect(employeeIds).toEqual(['EMP001', 'EMP002', 'EMP003']);

    // Verify employee data structure and types
    result.forEach(employee => {
      expect(employee.id).toBeDefined();
      expect(typeof employee.id).toBe('number');
      expect(employee.name).toBeDefined();
      expect(typeof employee.name).toBe('string');
      expect(employee.employee_id).toBeDefined();
      expect(typeof employee.employee_id).toBe('string');
      expect(employee.email).toBeDefined();
      expect(typeof employee.email).toBe('string');
      expect(employee.department).toBeDefined();
      expect(typeof employee.department).toBe('string');
      expect(employee.position).toBeDefined();
      expect(typeof employee.position).toBe('string');
      expect(employee.hire_date).toBeInstanceOf(Date);
      expect(employee.created_at).toBeInstanceOf(Date);
      expect(employee.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return employees with correct field values', async () => {
    // Create single test employee
    await db.insert(employeesTable)
      .values({
        name: testEmployee1.name,
        employee_id: testEmployee1.employee_id,
        email: testEmployee1.email,
        department: testEmployee1.department,
        position: testEmployee1.position,
        hire_date: testEmployee1.hire_date
      })
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(1);

    const employee = result[0];
    expect(employee.name).toEqual('John Doe');
    expect(employee.employee_id).toEqual('EMP001');
    expect(employee.email).toEqual('john.doe@company.com');
    expect(employee.department).toEqual('Engineering');
    expect(employee.position).toEqual('Software Engineer');
    expect(employee.hire_date).toEqual(new Date('2023-01-15'));
  });

  it('should return employees from different departments', async () => {
    // Create employees from different departments
    await db.insert(employeesTable)
      .values([
        {
          name: testEmployee1.name,
          employee_id: testEmployee1.employee_id,
          email: testEmployee1.email,
          department: testEmployee1.department,
          position: testEmployee1.position,
          hire_date: testEmployee1.hire_date
        },
        {
          name: testEmployee2.name,
          employee_id: testEmployee2.employee_id,
          email: testEmployee2.email,
          department: testEmployee2.department,
          position: testEmployee2.position,
          hire_date: testEmployee2.hire_date
        }
      ])
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(2);

    // Verify different departments are returned
    const departments = result.map(emp => emp.department).sort();
    expect(departments).toEqual(['Engineering', 'Marketing']);

    // Find specific employees
    const engineeringEmployee = result.find(emp => emp.department === 'Engineering');
    const marketingEmployee = result.find(emp => emp.department === 'Marketing');

    expect(engineeringEmployee).toBeDefined();
    expect(engineeringEmployee!.name).toEqual('John Doe');
    expect(engineeringEmployee!.position).toEqual('Software Engineer');

    expect(marketingEmployee).toBeDefined();
    expect(marketingEmployee!.name).toEqual('Jane Smith');
    expect(marketingEmployee!.position).toEqual('Marketing Manager');
  });

  it('should return employees ordered by creation time', async () => {
    // Create employees with slight delay to ensure different timestamps
    await db.insert(employeesTable)
      .values({
        name: testEmployee1.name,
        employee_id: testEmployee1.employee_id,
        email: testEmployee1.email,
        department: testEmployee1.department,
        position: testEmployee1.position,
        hire_date: testEmployee1.hire_date
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(employeesTable)
      .values({
        name: testEmployee2.name,
        employee_id: testEmployee2.employee_id,
        email: testEmployee2.email,
        department: testEmployee2.department,
        position: testEmployee2.position,
        hire_date: testEmployee2.hire_date
      })
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(2);

    // Verify timestamps are in ascending order (oldest first)
    expect(result[0].created_at <= result[1].created_at).toBe(true);

    // Verify the first employee created comes first
    expect(result[0].employee_id).toEqual('EMP001');
    expect(result[1].employee_id).toEqual('EMP002');
  });
});