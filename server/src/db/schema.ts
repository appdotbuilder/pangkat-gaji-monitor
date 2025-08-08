import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const adjustmentTypeEnum = pgEnum('adjustment_type', ['annual_increase', 'promotion', 'performance', 'other']);
export const promotionStatusEnum = pgEnum('promotion_status', ['pending', 'approved', 'completed', 'cancelled']);

// Employees table
export const employeesTable = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  employee_id: text('employee_id').notNull().unique(), // Unique employee identifier
  email: text('email').notNull().unique(),
  department: text('department').notNull(),
  position: text('position').notNull(),
  hire_date: timestamp('hire_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Promotion history table
export const promotionHistoryTable = pgTable('promotion_history', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').references(() => employeesTable.id).notNull(),
  previous_position: text('previous_position'), // Nullable for first promotion
  new_position: text('new_position').notNull(),
  previous_salary: numeric('previous_salary', { precision: 12, scale: 2 }), // Nullable for first promotion
  new_salary: numeric('new_salary', { precision: 12, scale: 2 }).notNull(),
  promotion_date: timestamp('promotion_date').notNull(),
  effective_date: timestamp('effective_date').notNull(),
  notes: text('notes'), // Nullable field for additional information
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Salary adjustments table
export const salaryAdjustmentsTable = pgTable('salary_adjustments', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').references(() => employeesTable.id).notNull(),
  previous_salary: numeric('previous_salary', { precision: 12, scale: 2 }).notNull(),
  new_salary: numeric('new_salary', { precision: 12, scale: 2 }).notNull(),
  adjustment_type: adjustmentTypeEnum('adjustment_type').notNull(),
  adjustment_percentage: numeric('adjustment_percentage', { precision: 5, scale: 2 }), // Nullable field
  effective_date: timestamp('effective_date').notNull(),
  notes: text('notes'), // Nullable field for additional information
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Promotion schedule table for tracking upcoming promotions
export const promotionScheduleTable = pgTable('promotion_schedule', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').references(() => employeesTable.id).notNull(),
  current_position: text('current_position').notNull(),
  target_position: text('target_position').notNull(),
  current_salary: numeric('current_salary', { precision: 12, scale: 2 }).notNull(),
  target_salary: numeric('target_salary', { precision: 12, scale: 2 }).notNull(),
  scheduled_date: timestamp('scheduled_date').notNull(),
  status: promotionStatusEnum('status').default('pending').notNull(),
  notes: text('notes'), // Nullable field
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const employeesRelations = relations(employeesTable, ({ many }) => ({
  promotionHistory: many(promotionHistoryTable),
  salaryAdjustments: many(salaryAdjustmentsTable),
  promotionSchedule: many(promotionScheduleTable),
}));

export const promotionHistoryRelations = relations(promotionHistoryTable, ({ one }) => ({
  employee: one(employeesTable, {
    fields: [promotionHistoryTable.employee_id],
    references: [employeesTable.id],
  }),
}));

export const salaryAdjustmentsRelations = relations(salaryAdjustmentsTable, ({ one }) => ({
  employee: one(employeesTable, {
    fields: [salaryAdjustmentsTable.employee_id],
    references: [employeesTable.id],
  }),
}));

export const promotionScheduleRelations = relations(promotionScheduleTable, ({ one }) => ({
  employee: one(employeesTable, {
    fields: [promotionScheduleTable.employee_id],
    references: [employeesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Employee = typeof employeesTable.$inferSelect;
export type NewEmployee = typeof employeesTable.$inferInsert;

export type PromotionHistory = typeof promotionHistoryTable.$inferSelect;
export type NewPromotionHistory = typeof promotionHistoryTable.$inferInsert;

export type SalaryAdjustment = typeof salaryAdjustmentsTable.$inferSelect;
export type NewSalaryAdjustment = typeof salaryAdjustmentsTable.$inferInsert;

export type PromotionSchedule = typeof promotionScheduleTable.$inferSelect;
export type NewPromotionSchedule = typeof promotionScheduleTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  employees: employeesTable,
  promotionHistory: promotionHistoryTable,
  salaryAdjustments: salaryAdjustmentsTable,
  promotionSchedule: promotionScheduleTable,
};