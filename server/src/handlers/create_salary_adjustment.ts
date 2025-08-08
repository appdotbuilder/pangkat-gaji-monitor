import { db } from '../db';
import { salaryAdjustmentsTable, employeesTable } from '../db/schema';
import { type CreateSalaryAdjustmentInput, type SalaryAdjustment } from '../schema';
import { eq } from 'drizzle-orm';

export const createSalaryAdjustment = async (input: CreateSalaryAdjustmentInput): Promise<SalaryAdjustment> => {
  try {
    // Validate that employee exists
    const employee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.employee_id))
      .execute();

    if (employee.length === 0) {
      throw new Error(`Employee with id ${input.employee_id} not found`);
    }

    // Calculate adjustment percentage if not provided
    let adjustmentPercentage = input.adjustment_percentage;
    if (adjustmentPercentage === null || adjustmentPercentage === undefined) {
      if (input.previous_salary > 0) {
        const percentageChange = ((input.new_salary - input.previous_salary) / input.previous_salary) * 100;
        adjustmentPercentage = Math.round(percentageChange * 100) / 100; // Round to 2 decimal places
      } else {
        adjustmentPercentage = null;
      }
    }

    // Insert salary adjustment record
    const result = await db.insert(salaryAdjustmentsTable)
      .values({
        employee_id: input.employee_id,
        previous_salary: input.previous_salary.toString(),
        new_salary: input.new_salary.toString(),
        adjustment_type: input.adjustment_type,
        adjustment_percentage: adjustmentPercentage?.toString() || null,
        effective_date: input.effective_date,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const salaryAdjustment = result[0];
    return {
      ...salaryAdjustment,
      previous_salary: parseFloat(salaryAdjustment.previous_salary),
      new_salary: parseFloat(salaryAdjustment.new_salary),
      adjustment_percentage: salaryAdjustment.adjustment_percentage 
        ? parseFloat(salaryAdjustment.adjustment_percentage) 
        : null
    };
  } catch (error) {
    console.error('Salary adjustment creation failed:', error);
    throw error;
  }
};