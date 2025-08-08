import { z } from 'zod';

// Employee schema
export const employeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  employee_id: z.string(), // Unique employee identifier
  email: z.string().email(),
  department: z.string(),
  position: z.string(),
  hire_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Employee = z.infer<typeof employeeSchema>;

// Promotion history schema
export const promotionHistorySchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  previous_position: z.string().nullable(),
  new_position: z.string(),
  previous_salary: z.number().nullable(),
  new_salary: z.number(),
  promotion_date: z.coerce.date(),
  effective_date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type PromotionHistory = z.infer<typeof promotionHistorySchema>;

// Salary adjustment schema
export const salaryAdjustmentSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  previous_salary: z.number(),
  new_salary: z.number(),
  adjustment_type: z.enum(['annual_increase', 'promotion', 'performance', 'other']),
  adjustment_percentage: z.number().nullable(),
  effective_date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type SalaryAdjustment = z.infer<typeof salaryAdjustmentSchema>;

// Promotion schedule schema for tracking upcoming promotions
export const promotionScheduleSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  current_position: z.string(),
  target_position: z.string(),
  current_salary: z.number(),
  target_salary: z.number(),
  scheduled_date: z.coerce.date(),
  status: z.enum(['pending', 'approved', 'completed', 'cancelled']),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PromotionSchedule = z.infer<typeof promotionScheduleSchema>;

// Input schemas for creating records
export const createEmployeeInputSchema = z.object({
  name: z.string(),
  employee_id: z.string(),
  email: z.string().email(),
  department: z.string(),
  position: z.string(),
  hire_date: z.coerce.date()
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;

export const createPromotionHistoryInputSchema = z.object({
  employee_id: z.number(),
  previous_position: z.string().nullable(),
  new_position: z.string(),
  previous_salary: z.number().nullable(),
  new_salary: z.number(),
  promotion_date: z.coerce.date(),
  effective_date: z.coerce.date(),
  notes: z.string().nullable().optional()
});

export type CreatePromotionHistoryInput = z.infer<typeof createPromotionHistoryInputSchema>;

export const createSalaryAdjustmentInputSchema = z.object({
  employee_id: z.number(),
  previous_salary: z.number(),
  new_salary: z.number(),
  adjustment_type: z.enum(['annual_increase', 'promotion', 'performance', 'other']),
  adjustment_percentage: z.number().nullable().optional(),
  effective_date: z.coerce.date(),
  notes: z.string().nullable().optional()
});

export type CreateSalaryAdjustmentInput = z.infer<typeof createSalaryAdjustmentInputSchema>;

export const createPromotionScheduleInputSchema = z.object({
  employee_id: z.number(),
  current_position: z.string(),
  target_position: z.string(),
  current_salary: z.number(),
  target_salary: z.number(),
  scheduled_date: z.coerce.date(),
  status: z.enum(['pending', 'approved', 'completed', 'cancelled']).default('pending'),
  notes: z.string().nullable().optional()
});

export type CreatePromotionScheduleInput = z.infer<typeof createPromotionScheduleInputSchema>;

// Update schemas
export const updateEmployeeInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  position: z.string().optional()
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeInputSchema>;

export const updatePromotionScheduleInputSchema = z.object({
  id: z.number(),
  target_position: z.string().optional(),
  target_salary: z.number().optional(),
  scheduled_date: z.coerce.date().optional(),
  status: z.enum(['pending', 'approved', 'completed', 'cancelled']).optional(),
  notes: z.string().nullable().optional()
});

export type UpdatePromotionScheduleInput = z.infer<typeof updatePromotionScheduleInputSchema>;

// Query input schemas
export const getEmployeeByIdInputSchema = z.object({
  id: z.number()
});

export type GetEmployeeByIdInput = z.infer<typeof getEmployeeByIdInputSchema>;

export const getPromotionHistoryByEmployeeInputSchema = z.object({
  employee_id: z.number()
});

export type GetPromotionHistoryByEmployeeInput = z.infer<typeof getPromotionHistoryByEmployeeInputSchema>;

export const getSalaryAdjustmentsByEmployeeInputSchema = z.object({
  employee_id: z.number()
});

export type GetSalaryAdjustmentsByEmployeeInput = z.infer<typeof getSalaryAdjustmentsByEmployeeInputSchema>;

export const getUpcomingPromotionsInputSchema = z.object({
  days_ahead: z.number().int().positive().default(30)
});

export type GetUpcomingPromotionsInput = z.infer<typeof getUpcomingPromotionsInputSchema>;