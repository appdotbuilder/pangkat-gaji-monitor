import { db } from '../db';
import { promotionScheduleTable, employeesTable } from '../db/schema';
import { type CreatePromotionScheduleInput, type PromotionSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const createPromotionSchedule = async (input: CreatePromotionScheduleInput): Promise<PromotionSchedule> => {
  try {
    // Validate that employee exists
    const employee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.employee_id))
      .execute();

    if (employee.length === 0) {
      throw new Error(`Employee with id ${input.employee_id} not found`);
    }

    // Insert promotion schedule record
    const result = await db.insert(promotionScheduleTable)
      .values({
        employee_id: input.employee_id,
        current_position: input.current_position,
        target_position: input.target_position,
        current_salary: input.current_salary.toString(), // Convert number to string for numeric column
        target_salary: input.target_salary.toString(), // Convert number to string for numeric column
        scheduled_date: input.scheduled_date,
        status: input.status, // Zod has already applied default 'pending'
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const promotionSchedule = result[0];
    return {
      ...promotionSchedule,
      current_salary: parseFloat(promotionSchedule.current_salary), // Convert string back to number
      target_salary: parseFloat(promotionSchedule.target_salary) // Convert string back to number
    };
  } catch (error) {
    console.error('Promotion schedule creation failed:', error);
    throw error;
  }
};