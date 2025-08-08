import { db } from '../db';
import { promotionScheduleTable } from '../db/schema';
import { type UpdatePromotionScheduleInput, type PromotionSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePromotionSchedule = async (input: UpdatePromotionScheduleInput): Promise<PromotionSchedule> => {
  try {
    // First check if the promotion schedule exists
    const existing = await db.select()
      .from(promotionScheduleTable)
      .where(eq(promotionScheduleTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Promotion schedule with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.target_position !== undefined) {
      updateData.target_position = input.target_position;
    }

    if (input.target_salary !== undefined) {
      updateData.target_salary = input.target_salary.toString(); // Convert number to string for numeric column
    }

    if (input.scheduled_date !== undefined) {
      updateData.scheduled_date = input.scheduled_date;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the promotion schedule
    const result = await db.update(promotionScheduleTable)
      .set(updateData)
      .where(eq(promotionScheduleTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const promotionSchedule = result[0];
    return {
      ...promotionSchedule,
      current_salary: parseFloat(promotionSchedule.current_salary),
      target_salary: parseFloat(promotionSchedule.target_salary)
    };
  } catch (error) {
    console.error('Promotion schedule update failed:', error);
    throw error;
  }
};