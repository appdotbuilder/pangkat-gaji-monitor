import { db } from '../db';
import { salaryAdjustmentsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type GetSalaryAdjustmentsByEmployeeInput, type SalaryAdjustment } from '../schema';

export async function getSalaryAdjustmentsByEmployee(input: GetSalaryAdjustmentsByEmployeeInput): Promise<SalaryAdjustment[]> {
  try {
    // Query salary adjustments for the specific employee, ordered by effective_date (most recent first)
    const results = await db.select()
      .from(salaryAdjustmentsTable)
      .where(eq(salaryAdjustmentsTable.employee_id, input.employee_id))
      .orderBy(desc(salaryAdjustmentsTable.effective_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(adjustment => ({
      ...adjustment,
      previous_salary: parseFloat(adjustment.previous_salary),
      new_salary: parseFloat(adjustment.new_salary),
      adjustment_percentage: adjustment.adjustment_percentage ? parseFloat(adjustment.adjustment_percentage) : null
    }));
  } catch (error) {
    console.error('Failed to get salary adjustments by employee:', error);
    throw error;
  }
}