import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum([
  'administrator',
  'admin_pusat',
  'pengurus_pusat',
  'pengajar_pusat',
  'pelajar'
]);

export const classTypeSchema = z.enum(['physical', 'online', 'on_call']);
export const materialTypeSchema = z.enum(['quran', 'notebook', 'other']);
export const fundTypeSchema = z.enum(['donation', 'study', 'waqf', 'infaq', 'sadaqa']);
export const paymentStatusSchema = z.enum(['pending', 'paid', 'overdue']);
export const attendanceStatusSchema = z.enum(['present', 'absent', 'late']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Study Center schema
export const studyCenterSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  registration_number: z.string().nullable(),
  admin_id: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type StudyCenter = z.infer<typeof studyCenterSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  study_center_id: z.number(),
  ic_number: z.string(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  qualifications: z.string().nullable(),
  jaij_permit_number: z.string().nullable(),
  jaij_permit_expiry: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Teacher = z.infer<typeof teacherSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  study_center_id: z.number(),
  ic_number: z.string(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  parent_name: z.string().nullable(),
  parent_phone: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Student = z.infer<typeof studentSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  study_center_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  class_type: classTypeSchema,
  teacher_id: z.number(),
  schedule_day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  max_students: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Class = z.infer<typeof classSchema>;

// Class Enrollment schema
export const classEnrollmentSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  student_id: z.number(),
  enrolled_at: z.coerce.date(),
  is_active: z.boolean(),
});

export type ClassEnrollment = z.infer<typeof classEnrollmentSchema>;

// Attendance schema
export const attendanceSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  student_id: z.number(),
  date: z.coerce.date(),
  status: attendanceStatusSchema,
  notes: z.string().nullable(),
  recorded_by: z.number(),
  recorded_at: z.coerce.date(),
});

export type Attendance = z.infer<typeof attendanceSchema>;

// Payment schema
export const paymentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  study_center_id: z.number(),
  amount: z.number(),
  description: z.string(),
  status: paymentStatusSchema,
  due_date: z.coerce.date(),
  paid_date: z.coerce.date().nullable(),
  recorded_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Payment = z.infer<typeof paymentSchema>;

// Video schema
export const videoSchema = z.object({
  id: z.number(),
  study_center_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  file_url: z.string(),
  duration: z.number().nullable(),
  uploaded_by: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Video = z.infer<typeof videoSchema>;

// Material Distribution schema
export const materialDistributionSchema = z.object({
  id: z.number(),
  study_center_id: z.number(),
  material_type: materialTypeSchema,
  item_name: z.string(),
  quantity: z.number().int(),
  recipient_id: z.number().nullable(),
  distribution_date: z.coerce.date(),
  is_sale: z.boolean(),
  price: z.number().nullable(),
  notes: z.string().nullable(),
  recorded_by: z.number(),
  created_at: z.coerce.date(),
});

export type MaterialDistribution = z.infer<typeof materialDistributionSchema>;

// Fund Management schema
export const fundTransactionSchema = z.object({
  id: z.number(),
  study_center_id: z.number(),
  fund_type: fundTypeSchema,
  amount: z.number(),
  description: z.string(),
  contributor_name: z.string().nullable(),
  contributor_phone: z.string().nullable(),
  transaction_date: z.coerce.date(),
  recorded_by: z.number(),
  created_at: z.coerce.date(),
});

export type FundTransaction = z.infer<typeof fundTransactionSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createStudyCenterInputSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  registration_number: z.string().nullable(),
  admin_id: z.number(),
});

export type CreateStudyCenterInput = z.infer<typeof createStudyCenterInputSchema>;

export const createTeacherInputSchema = z.object({
  user_id: z.number(),
  study_center_id: z.number(),
  ic_number: z.string(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  qualifications: z.string().nullable(),
  jaij_permit_number: z.string().nullable(),
  jaij_permit_expiry: z.coerce.date().nullable(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>;

export const createStudentInputSchema = z.object({
  user_id: z.number(),
  study_center_id: z.number(),
  ic_number: z.string(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  parent_name: z.string().nullable(),
  parent_phone: z.string().nullable(),
  emergency_contact: z.string().nullable(),
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const createClassInputSchema = z.object({
  study_center_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  class_type: classTypeSchema,
  teacher_id: z.number(),
  schedule_day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  max_students: z.number().int().positive(),
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const createAttendanceInputSchema = z.object({
  class_id: z.number(),
  student_id: z.number(),
  date: z.coerce.date(),
  status: attendanceStatusSchema,
  notes: z.string().nullable(),
  recorded_by: z.number(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceInputSchema>;

export const createPaymentInputSchema = z.object({
  student_id: z.number(),
  study_center_id: z.number(),
  amount: z.number().positive(),
  description: z.string(),
  due_date: z.coerce.date(),
  recorded_by: z.number(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

export const createVideoInputSchema = z.object({
  study_center_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  file_url: z.string().url(),
  duration: z.number().nullable(),
  uploaded_by: z.number(),
});

export type CreateVideoInput = z.infer<typeof createVideoInputSchema>;

export const createMaterialDistributionInputSchema = z.object({
  study_center_id: z.number(),
  material_type: materialTypeSchema,
  item_name: z.string(),
  quantity: z.number().int().positive(),
  recipient_id: z.number().nullable(),
  distribution_date: z.coerce.date(),
  is_sale: z.boolean(),
  price: z.number().nullable(),
  notes: z.string().nullable(),
  recorded_by: z.number(),
});

export type CreateMaterialDistributionInput = z.infer<typeof createMaterialDistributionInputSchema>;

export const createFundTransactionInputSchema = z.object({
  study_center_id: z.number(),
  fund_type: fundTypeSchema,
  amount: z.number().positive(),
  description: z.string(),
  contributor_name: z.string().nullable(),
  contributor_phone: z.string().nullable(),
  transaction_date: z.coerce.date(),
  recorded_by: z.number(),
});

export type CreateFundTransactionInput = z.infer<typeof createFundTransactionInputSchema>;

// Update schemas
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  phone: z.string().nullable().optional(),
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updatePaymentInputSchema = z.object({
  id: z.number(),
  status: paymentStatusSchema.optional(),
  paid_date: z.coerce.date().nullable().optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentInputSchema>;

// Query schemas
export const getAttendanceByClassInputSchema = z.object({
  class_id: z.number(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
});

export type GetAttendanceByClassInput = z.infer<typeof getAttendanceByClassInputSchema>;

export const getPaymentsByStudentInputSchema = z.object({
  student_id: z.number(),
  status: paymentStatusSchema.optional(),
});

export type GetPaymentsByStudentInput = z.infer<typeof getPaymentsByStudentInputSchema>;