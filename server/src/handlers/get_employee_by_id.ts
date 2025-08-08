import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type GetEmployeeByIdInput, type Employee } from '../schema';
import { eq } from 'drizzle-orm';

export async function getEmployeeById(input: GetEmployeeByIdInput): Promise<Employee | null> {
  try {
    // Query employee by ID
    const results = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.id))
      .execute();

    // Return null if employee not found
    if (results.length === 0) {
      return null;
    }

    // Return the employee record
    const employee = results[0];
    return {
      ...employee,
      // Convert Date objects from database timestamps
      hire_date: employee.hire_date,
      created_at: employee.created_at,
      updated_at: employee.updated_at
    };
  } catch (error) {
    console.error('Failed to get employee by ID:', error);
    throw error;
  }
}