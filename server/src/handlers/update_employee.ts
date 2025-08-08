import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type UpdateEmployeeInput, type Employee } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEmployee = async (input: UpdateEmployeeInput): Promise<Employee> => {
  try {
    // First, check if employee exists
    const existingEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.id))
      .execute();

    if (existingEmployee.length === 0) {
      throw new Error(`Employee with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.department !== undefined) {
      updateData.department = input.department;
    }

    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    // Update the employee record
    const result = await db.update(employeesTable)
      .set(updateData)
      .where(eq(employeesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Employee update failed:', error);
    throw error;
  }
};