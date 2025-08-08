import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput, type Employee } from '../schema';

export const createEmployee = async (input: CreateEmployeeInput): Promise<Employee> => {
  try {
    // Insert employee record
    const result = await db.insert(employeesTable)
      .values({
        name: input.name,
        employee_id: input.employee_id,
        email: input.email,
        department: input.department,
        position: input.position,
        hire_date: input.hire_date
      })
      .returning()
      .execute();

    // Return the created employee
    const employee = result[0];
    return employee;
  } catch (error) {
    console.error('Employee creation failed:', error);
    throw error;
  }
};