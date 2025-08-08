import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type Employee } from '../schema';

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    // Fetch all employees from the database
    const result = await db.select()
      .from(employeesTable)
      .execute();

    // Return employees as-is since all fields are already in the correct format
    // (timestamps are Date objects, numbers remain numbers, strings remain strings)
    return result;
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw error;
  }
};