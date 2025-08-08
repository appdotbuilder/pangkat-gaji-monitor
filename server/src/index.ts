import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createEmployeeInputSchema,
  getEmployeeByIdInputSchema,
  updateEmployeeInputSchema,
  createPromotionHistoryInputSchema,
  getPromotionHistoryByEmployeeInputSchema,
  createSalaryAdjustmentInputSchema,
  getSalaryAdjustmentsByEmployeeInputSchema,
  createPromotionScheduleInputSchema,
  updatePromotionScheduleInputSchema,
  getUpcomingPromotionsInputSchema,
} from './schema';

// Import handlers
import { createEmployee } from './handlers/create_employee';
import { getEmployees } from './handlers/get_employees';
import { getEmployeeById } from './handlers/get_employee_by_id';
import { updateEmployee } from './handlers/update_employee';
import { createPromotionHistory } from './handlers/create_promotion_history';
import { getPromotionHistoryByEmployee } from './handlers/get_promotion_history_by_employee';
import { createSalaryAdjustment } from './handlers/create_salary_adjustment';
import { getSalaryAdjustmentsByEmployee } from './handlers/get_salary_adjustments_by_employee';
import { createPromotionSchedule } from './handlers/create_promotion_schedule';
import { updatePromotionSchedule } from './handlers/update_promotion_schedule';
import { getUpcomingPromotions } from './handlers/get_upcoming_promotions';
import { getAllPromotionSchedules } from './handlers/get_all_promotion_schedules';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Employee management routes
  createEmployee: publicProcedure
    .input(createEmployeeInputSchema)
    .mutation(({ input }) => createEmployee(input)),
    
  getEmployees: publicProcedure
    .query(() => getEmployees()),
    
  getEmployeeById: publicProcedure
    .input(getEmployeeByIdInputSchema)
    .query(({ input }) => getEmployeeById(input)),
    
  updateEmployee: publicProcedure
    .input(updateEmployeeInputSchema)
    .mutation(({ input }) => updateEmployee(input)),

  // Promotion history routes
  createPromotionHistory: publicProcedure
    .input(createPromotionHistoryInputSchema)
    .mutation(({ input }) => createPromotionHistory(input)),
    
  getPromotionHistoryByEmployee: publicProcedure
    .input(getPromotionHistoryByEmployeeInputSchema)
    .query(({ input }) => getPromotionHistoryByEmployee(input)),

  // Salary adjustment routes
  createSalaryAdjustment: publicProcedure
    .input(createSalaryAdjustmentInputSchema)
    .mutation(({ input }) => createSalaryAdjustment(input)),
    
  getSalaryAdjustmentsByEmployee: publicProcedure
    .input(getSalaryAdjustmentsByEmployeeInputSchema)
    .query(({ input }) => getSalaryAdjustmentsByEmployee(input)),

  // Promotion schedule routes
  createPromotionSchedule: publicProcedure
    .input(createPromotionScheduleInputSchema)
    .mutation(({ input }) => createPromotionSchedule(input)),
    
  updatePromotionSchedule: publicProcedure
    .input(updatePromotionScheduleInputSchema)
    .mutation(({ input }) => updatePromotionSchedule(input)),
    
  getAllPromotionSchedules: publicProcedure
    .query(() => getAllPromotionSchedules()),
    
  getUpcomingPromotions: publicProcedure
    .input(getUpcomingPromotionsInputSchema)
    .query(({ input }) => getUpcomingPromotions(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();