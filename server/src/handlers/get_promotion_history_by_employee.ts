import { db } from '../db';
import { promotionHistoryTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type GetPromotionHistoryByEmployeeInput, type PromotionHistory } from '../schema';

export async function getPromotionHistoryByEmployee(input: GetPromotionHistoryByEmployeeInput): Promise<PromotionHistory[]> {
  try {
    // Query promotion history for the specific employee, ordered by promotion_date (most recent first)
    const results = await db.select()
      .from(promotionHistoryTable)
      .where(eq(promotionHistoryTable.employee_id, input.employee_id))
      .orderBy(desc(promotionHistoryTable.promotion_date))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(record => ({
      ...record,
      previous_salary: record.previous_salary ? parseFloat(record.previous_salary) : null,
      new_salary: parseFloat(record.new_salary)
    }));
  } catch (error) {
    console.error('Failed to fetch promotion history:', error);
    throw error;
  }
}