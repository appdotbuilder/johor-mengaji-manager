import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password using Bun's built-in password hashing
    const password_hash = await Bun.password.hash(input.password, {
      algorithm: 'bcrypt',
      cost: 12
    });

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        full_name: input.full_name,
        phone: input.phone,
        role: input.role,
        is_active: true // Default value from schema
      })
      .returning()
      .execute();

    // Return the created user
    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};