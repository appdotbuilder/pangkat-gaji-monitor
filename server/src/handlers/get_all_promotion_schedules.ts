import { db } from '../db';
import { promotionScheduleTable, employeesTable } from '../db/schema';
import { type PromotionSchedule } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getAllPromotionSchedules(): Promise<PromotionSchedule[]> {
  try {
    // Query promotion schedules with employee information using join
    const results = await db.select()
      .from(promotionScheduleTable)
      .innerJoin(employeesTable, eq(promotionScheduleTable.employee_id, employeesTable.id))
      .orderBy(asc(promotionScheduleTable.scheduled_date))
      .execute();

    // Transform results to match PromotionSchedule schema
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
    console.error('Failed to get all promotion schedules:', error);
    throw error;
  }
}