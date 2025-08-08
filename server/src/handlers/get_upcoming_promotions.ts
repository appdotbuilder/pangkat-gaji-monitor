import { db } from '../db';
import { promotionScheduleTable, employeesTable } from '../db/schema';
import { type GetUpcomingPromotionsInput, type PromotionSchedule } from '../schema';
import { lte, inArray, eq, and } from 'drizzle-orm';

export const getUpcomingPromotions = async (input: GetUpcomingPromotionsInput): Promise<PromotionSchedule[]> => {
  try {
    // Calculate the target date (current date + days_ahead)
    const currentDate = new Date();
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + input.days_ahead);

    // Query promotions that are due within the specified timeframe
    // Only include 'pending' or 'approved' status promotions
    const results = await db.select()
      .from(promotionScheduleTable)
      .innerJoin(employeesTable, eq(promotionScheduleTable.employee_id, employeesTable.id))
      .where(
        and(
          lte(promotionScheduleTable.scheduled_date, targetDate),
          inArray(promotionScheduleTable.status, ['pending', 'approved'])
        )
      )
      .execute();

    // Transform results to include employee information and convert numeric fields
    return results.map(result => ({
      id: result.promotion_schedule.id,
      employee_id: result.promotion_schedule.employee_id,
      current_position: result.promotion_schedule.current_position,
      target_position: result.promotion_schedule.target_position,
      current_salary: parseFloat(result.promotion_schedule.current_salary),
      target_salary: parseFloat(result.promotion_schedule.target_salary),
      scheduled_date: result.promotion_schedule.scheduled_date,
      status: result.promotion_schedule.status,
      notes: result.promotion_schedule.notes,
      created_at: result.promotion_schedule.created_at,
      updated_at: result.promotion_schedule.updated_at
    }));
  } catch (error) {
    console.error('Get upcoming promotions failed:', error);
    throw error;
  }
};