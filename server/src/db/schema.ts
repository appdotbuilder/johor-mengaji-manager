import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  date,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'administrator',
  'admin_pusat',
  'pengurus_pusat',
  'pengajar_pusat',
  'pelajar'
]);

export const classTypeEnum = pgEnum('class_type', ['physical', 'online', 'on_call']);
export const materialTypeEnum = pgEnum('material_type', ['quran', 'notebook', 'other']);
export const fundTypeEnum = pgEnum('fund_type', ['donation', 'study', 'waqf', 'infaq', 'sadaqa']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Study Centers table
export const studyCentersTable = pgTable('study_centers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  email: text('email'),
  registration_number: text('registration_number'),
  admin_id: integer('admin_id').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Teachers table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  study_center_id: integer('study_center_id').notNull(),
  ic_number: text('ic_number').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  address: text('address').notNull(),
  qualifications: text('qualifications'),
  jaij_permit_number: text('jaij_permit_number'),
  jaij_permit_expiry: date('jaij_permit_expiry'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  study_center_id: integer('study_center_id').notNull(),
  ic_number: text('ic_number').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  address: text('address').notNull(),
  parent_name: text('parent_name'),
  parent_phone: text('parent_phone'),
  emergency_contact: text('emergency_contact'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  study_center_id: integer('study_center_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  class_type: classTypeEnum('class_type').notNull(),
  teacher_id: integer('teacher_id').notNull(),
  schedule_day: text('schedule_day').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time').notNull(),
  max_students: integer('max_students').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Class Enrollments table
export const classEnrollmentsTable = pgTable('class_enrollments', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull(),
  student_id: integer('student_id').notNull(),
  enrolled_at: timestamp('enrolled_at').defaultNow().notNull(),
  is_active: boolean('is_active').notNull().default(true),
});

// Attendance table
export const attendanceTable = pgTable('attendance', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull(),
  student_id: integer('student_id').notNull(),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  notes: text('notes'),
  recorded_by: integer('recorded_by').notNull(),
  recorded_at: timestamp('recorded_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull(),
  study_center_id: integer('study_center_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  due_date: date('due_date').notNull(),
  paid_date: date('paid_date'),
  recorded_by: integer('recorded_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Videos table
export const videosTable = pgTable('videos', {
  id: serial('id').primaryKey(),
  study_center_id: integer('study_center_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  file_url: text('file_url').notNull(),
  duration: integer('duration'),
  uploaded_by: integer('uploaded_by').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Material Distributions table
export const materialDistributionsTable = pgTable('material_distributions', {
  id: serial('id').primaryKey(),
  study_center_id: integer('study_center_id').notNull(),
  material_type: materialTypeEnum('material_type').notNull(),
  item_name: text('item_name').notNull(),
  quantity: integer('quantity').notNull(),
  recipient_id: integer('recipient_id'),
  distribution_date: date('distribution_date').notNull(),
  is_sale: boolean('is_sale').notNull().default(false),
  price: numeric('price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  recorded_by: integer('recorded_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Fund Transactions table
export const fundTransactionsTable = pgTable('fund_transactions', {
  id: serial('id').primaryKey(),
  study_center_id: integer('study_center_id').notNull(),
  fund_type: fundTypeEnum('fund_type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  contributor_name: text('contributor_name'),
  contributor_phone: text('contributor_phone'),
  transaction_date: date('transaction_date').notNull(),
  recorded_by: integer('recorded_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many, one }) => ({
  studyCentersAsAdmin: many(studyCentersTable),
  teacherProfile: one(teachersTable, {
    fields: [usersTable.id],
    references: [teachersTable.user_id],
  }),
  studentProfile: one(studentsTable, {
    fields: [usersTable.id],
    references: [studentsTable.user_id],
  }),
}));

export const studyCentersRelations = relations(studyCentersTable, ({ many, one }) => ({
  admin: one(usersTable, {
    fields: [studyCentersTable.admin_id],
    references: [usersTable.id],
  }),
  teachers: many(teachersTable),
  students: many(studentsTable),
  classes: many(classesTable),
  payments: many(paymentsTable),
  videos: many(videosTable),
  materialDistributions: many(materialDistributionsTable),
  fundTransactions: many(fundTransactionsTable),
}));

export const teachersRelations = relations(teachersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [teachersTable.user_id],
    references: [usersTable.id],
  }),
  studyCenter: one(studyCentersTable, {
    fields: [teachersTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  classes: many(classesTable),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentsTable.user_id],
    references: [usersTable.id],
  }),
  studyCenter: one(studyCentersTable, {
    fields: [studentsTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  enrollments: many(classEnrollmentsTable),
  attendance: many(attendanceTable),
  payments: many(paymentsTable),
}));

export const classesRelations = relations(classesTable, ({ one, many }) => ({
  studyCenter: one(studyCentersTable, {
    fields: [classesTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  teacher: one(teachersTable, {
    fields: [classesTable.teacher_id],
    references: [teachersTable.id],
  }),
  enrollments: many(classEnrollmentsTable),
  attendance: many(attendanceTable),
}));

export const classEnrollmentsRelations = relations(classEnrollmentsTable, ({ one }) => ({
  class: one(classesTable, {
    fields: [classEnrollmentsTable.class_id],
    references: [classesTable.id],
  }),
  student: one(studentsTable, {
    fields: [classEnrollmentsTable.student_id],
    references: [studentsTable.id],
  }),
}));

export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
  class: one(classesTable, {
    fields: [attendanceTable.class_id],
    references: [classesTable.id],
  }),
  student: one(studentsTable, {
    fields: [attendanceTable.student_id],
    references: [studentsTable.id],
  }),
  recordedBy: one(usersTable, {
    fields: [attendanceTable.recorded_by],
    references: [usersTable.id],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [paymentsTable.student_id],
    references: [studentsTable.id],
  }),
  studyCenter: one(studyCentersTable, {
    fields: [paymentsTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  recordedBy: one(usersTable, {
    fields: [paymentsTable.recorded_by],
    references: [usersTable.id],
  }),
}));

export const videosRelations = relations(videosTable, ({ one }) => ({
  studyCenter: one(studyCentersTable, {
    fields: [videosTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  uploadedBy: one(usersTable, {
    fields: [videosTable.uploaded_by],
    references: [usersTable.id],
  }),
}));

export const materialDistributionsRelations = relations(materialDistributionsTable, ({ one }) => ({
  studyCenter: one(studyCentersTable, {
    fields: [materialDistributionsTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  recipient: one(usersTable, {
    fields: [materialDistributionsTable.recipient_id],
    references: [usersTable.id],
  }),
  recordedBy: one(usersTable, {
    fields: [materialDistributionsTable.recorded_by],
    references: [usersTable.id],
  }),
}));

export const fundTransactionsRelations = relations(fundTransactionsTable, ({ one }) => ({
  studyCenter: one(studyCentersTable, {
    fields: [fundTransactionsTable.study_center_id],
    references: [studyCentersTable.id],
  }),
  recordedBy: one(usersTable, {
    fields: [fundTransactionsTable.recorded_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for easy access
export const tables = {
  users: usersTable,
  studyCenters: studyCentersTable,
  teachers: teachersTable,
  students: studentsTable,
  classes: classesTable,
  classEnrollments: classEnrollmentsTable,
  attendance: attendanceTable,
  payments: paymentsTable,
  videos: videosTable,
  materialDistributions: materialDistributionsTable,
  fundTransactions: fundTransactionsTable,
};