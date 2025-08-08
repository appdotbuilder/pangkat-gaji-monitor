import { db } from '../db';
import { promotionHistoryTable, employeesTable } from '../db/schema';
import { type CreatePromotionHistoryInput, type PromotionHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const createPromotionHistory = async (input: CreatePromotionHistoryInput): Promise<PromotionHistory> => {
  try {
    // Validate that employee exists
    const existingEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.employee_id))
      .execute();

    if (existingEmployee.length === 0) {
      throw new Error(`Employee with ID ${input.employee_id} not found`);
    }

    // Insert promotion history record
    const result = await db.insert(promotionHistoryTable)
      .values({
        employee_id: input.employee_id,
        previous_position: input.previous_position,
        new_position: input.new_position,
        previous_salary: input.previous_salary?.toString() || null, // Convert number to string for numeric column
        new_salary: input.new_salary.toString(), // Convert number to string for numeric column
        promotion_date: input.promotion_date,
        effective_date: input.effective_date,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const promotionHistory = result[0];
    return {
      ...promotionHistory,
      previous_salary: promotionHistory.previous_salary ? parseFloat(promotionHistory.previous_salary) : null, // Convert string back to number
      new_salary: parseFloat(promotionHistory.new_salary) // Convert string back to number
    };
  } catch (error) {
    console.error('Promotion history creation failed:', error);
    throw error;
  }
};