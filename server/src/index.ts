import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createStudyCenterInputSchema,
  createTeacherInputSchema,
  createStudentInputSchema,
  createClassInputSchema,
  createAttendanceInputSchema,
  createPaymentInputSchema,
  updatePaymentInputSchema,
  createVideoInputSchema,
  createMaterialDistributionInputSchema,
  createFundTransactionInputSchema,
  getAttendanceByClassInputSchema,
  getPaymentsByStudentInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createStudyCenter } from './handlers/create_study_center';
import { getStudyCenters } from './handlers/get_study_centers';
import { createTeacher } from './handlers/create_teacher';
import { getTeachers } from './handlers/get_teachers';
import { createStudent } from './handlers/create_student';
import { getStudents } from './handlers/get_students';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { enrollStudent } from './handlers/enroll_student';
import { createAttendance } from './handlers/create_attendance';
import { getAttendanceByClass } from './handlers/get_attendance_by_class';
import { createPayment } from './handlers/create_payment';
import { updatePayment } from './handlers/update_payment';
import { getPaymentsByStudent } from './handlers/get_payments_by_student';
import { createVideo } from './handlers/create_video';
import { getVideos } from './handlers/get_videos';
import { createMaterialDistribution } from './handlers/create_material_distribution';
import { getMaterialDistributions } from './handlers/get_material_distributions';
import { createFundTransaction } from './handlers/create_fund_transaction';
import { getFundTransactions } from './handlers/get_fund_transactions';
import { getFinancialReport } from './handlers/get_financial_report';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User Management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Study Center Management
  createStudyCenter: publicProcedure
    .input(createStudyCenterInputSchema)
    .mutation(({ input }) => createStudyCenter(input)),
  
  getStudyCenters: publicProcedure
    .query(() => getStudyCenters()),

  // Teacher Management
  createTeacher: publicProcedure
    .input(createTeacherInputSchema)
    .mutation(({ input }) => createTeacher(input)),
  
  getTeachers: publicProcedure
    .query(() => getTeachers()),

  // Student Management
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
  
  getStudents: publicProcedure
    .query(() => getStudents()),

  // Class Management
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  
  getClasses: publicProcedure
    .query(() => getClasses()),

  enrollStudent: publicProcedure
    .input(z.object({ 
      classId: z.number(), 
      studentId: z.number() 
    }))
    .mutation(({ input }) => enrollStudent(input.classId, input.studentId)),

  // Attendance Management
  createAttendance: publicProcedure
    .input(createAttendanceInputSchema)
    .mutation(({ input }) => createAttendance(input)),
  
  getAttendanceByClass: publicProcedure
    .input(getAttendanceByClassInputSchema)
    .query(({ input }) => getAttendanceByClass(input)),

  // Payment Management
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),
  
  updatePayment: publicProcedure
    .input(updatePaymentInputSchema)
    .mutation(({ input }) => updatePayment(input)),
  
  getPaymentsByStudent: publicProcedure
    .input(getPaymentsByStudentInputSchema)
    .query(({ input }) => getPaymentsByStudent(input)),

  // Video Management
  createVideo: publicProcedure
    .input(createVideoInputSchema)
    .mutation(({ input }) => createVideo(input)),
  
  getVideos: publicProcedure
    .query(() => getVideos()),

  // Material Distribution Management
  createMaterialDistribution: publicProcedure
    .input(createMaterialDistributionInputSchema)
    .mutation(({ input }) => createMaterialDistribution(input)),
  
  getMaterialDistributions: publicProcedure
    .query(() => getMaterialDistributions()),

  // Fund & Donation Management
  createFundTransaction: publicProcedure
    .input(createFundTransactionInputSchema)
    .mutation(({ input }) => createFundTransaction(input)),
  
  getFundTransactions: publicProcedure
    .query(() => getFundTransactions()),

  // Financial Reporting
  getFinancialReport: publicProcedure
    .input(z.object({
      studyCenterId: z.number(),
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional()
    }))
    .query(({ input }) => getFinancialReport(input.studyCenterId, input.dateFrom, input.dateTo)),
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