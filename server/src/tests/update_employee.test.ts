import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type UpdateEmployeeInput } from '../schema';
import { updateEmployee } from '../handlers/update_employee';
import { eq } from 'drizzle-orm';

describe('updateEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test employee
  const createTestEmployee = async () => {
    const result = await db.insert(employeesTable)
      .values({
        name: 'John Doe',
        employee_id: 'EMP001',
        email: 'john.doe@example.com',
        department: 'Engineering',
        position: 'Software Developer',
        hire_date: new Date('2023-01-15')
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update employee name only', async () => {
    const employee = await createTestEmployee();
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id,
      name: 'Jane Smith'
    };

    const result = await updateEmployee(updateInput);

    expect(result.id).toEqual(employee.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual(employee.email); // Should remain unchanged
    expect(result.department).toEqual(employee.department); // Should remain unchanged
    expect(result.position).toEqual(employee.position); // Should remain unchanged
    expect(result.employee_id).toEqual(employee.employee_id); // Should remain unchanged
    expect(result.hire_date).toEqual(employee.hire_date); // Should remain unchanged
    expect(result.updated_at).not.toEqual(employee.updated_at); // Should be updated
  });

  it('should update multiple fields', async () => {
    const employee = await createTestEmployee();
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      department: 'Marketing',
      position: 'Marketing Manager'
    };

    const result = await updateEmployee(updateInput);

    expect(result.id).toEqual(employee.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.department).toEqual('Marketing');
    expect(result.position).toEqual('Marketing Manager');
    expect(result.employee_id).toEqual(employee.employee_id); // Should remain unchanged
    expect(result.hire_date).toEqual(employee.hire_date); // Should remain unchanged
    expect(result.updated_at).not.toEqual(employee.updated_at); // Should be updated
  });

  it('should update email only', async () => {
    const employee = await createTestEmployee();
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id,
      email: 'new.email@example.com'
    };

    const result = await updateEmployee(updateInput);

    expect(result.id).toEqual(employee.id);
    expect(result.email).toEqual('new.email@example.com');
    expect(result.name).toEqual(employee.name); // Should remain unchanged
    expect(result.department).toEqual(employee.department); // Should remain unchanged
    expect(result.position).toEqual(employee.position); // Should remain unchanged
    expect(result.updated_at).not.toEqual(employee.updated_at); // Should be updated
  });

  it('should update department and position only', async () => {
    const employee = await createTestEmployee();
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id,
      department: 'Human Resources',
      position: 'HR Specialist'
    };

    const result = await updateEmployee(updateInput);

    expect(result.id).toEqual(employee.id);
    expect(result.department).toEqual('Human Resources');
    expect(result.position).toEqual('HR Specialist');
    expect(result.name).toEqual(employee.name); // Should remain unchanged
    expect(result.email).toEqual(employee.email); // Should remain unchanged
    expect(result.updated_at).not.toEqual(employee.updated_at); // Should be updated
  });

  it('should persist changes in database', async () => {
    const employee = await createTestEmployee();
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    await updateEmployee(updateInput);

    // Verify changes were persisted in database
    const updatedEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employee.id))
      .execute();

    expect(updatedEmployee).toHaveLength(1);
    expect(updatedEmployee[0].name).toEqual('Updated Name');
    expect(updatedEmployee[0].email).toEqual('updated@example.com');
    expect(updatedEmployee[0].department).toEqual(employee.department);
    expect(updatedEmployee[0].position).toEqual(employee.position);
    expect(updatedEmployee[0].updated_at).not.toEqual(employee.updated_at);
  });

  it('should always update the updated_at timestamp', async () => {
    const employee = await createTestEmployee();
    const originalUpdatedAt = employee.updated_at;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id,
      name: 'Same Name Update'
    };

    const result = await updateEmployee(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when employee does not exist', async () => {
    const updateInput: UpdateEmployeeInput = {
      id: 999,
      name: 'Non-existent Employee'
    };

    expect(updateEmployee(updateInput)).rejects.toThrow(/Employee with ID 999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const employee = await createTestEmployee();
    
    const updateInput: UpdateEmployeeInput = {
      id: employee.id
      // No fields to update except ID
    };

    const result = await updateEmployee(updateInput);

    // Should still update the updated_at timestamp
    expect(result.id).toEqual(employee.id);
    expect(result.name).toEqual(employee.name);
    expect(result.email).toEqual(employee.email);
    expect(result.department).toEqual(employee.department);
    expect(result.position).toEqual(employee.position);
    expect(result.updated_at).not.toEqual(employee.updated_at);
  });

  it('should handle duplicate email constraint', async () => {
    // Create first employee
    const employee1 = await createTestEmployee();
    
    // Create second employee
    const employee2 = await db.insert(employeesTable)
      .values({
        name: 'Jane Smith',
        employee_id: 'EMP002',
        email: 'jane.smith@example.com',
        department: 'Marketing',
        position: 'Marketing Manager',
        hire_date: new Date('2023-02-15')
      })
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: employee1.id,
      email: 'jane.smith@example.com' // Try to use employee2's email
    };

    // Should throw constraint violation error
    expect(updateEmployee(updateInput)).rejects.toThrow();
  });
});