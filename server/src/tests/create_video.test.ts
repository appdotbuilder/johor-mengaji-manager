import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable, studyCentersTable, usersTable } from '../db/schema';
import { type CreateVideoInput } from '../schema';
import { createVideo } from '../handlers/create_video';
import { eq } from 'drizzle-orm';

describe('createVideo', () => {
  let testStudyCenterId: number;
  let testUserId: number;
  let testInput: CreateVideoInput;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test.teacher@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Teacher',
        phone: '+1234567890',
        role: 'pengajar_pusat',
        is_active: true
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test study center
    const centerResult = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: 'Test Address',
        phone: '+1234567890',
        email: 'test@center.com',
        registration_number: 'REG001',
        admin_id: testUserId,
        is_active: true
      })
      .returning()
      .execute();
    
    testStudyCenterId = centerResult[0].id;

    // Create test input
    testInput = {
      study_center_id: testStudyCenterId,
      title: 'Introduction to Quran Reading',
      description: 'Basic Quran reading techniques for beginners',
      file_url: 'https://example.com/videos/quran-intro.mp4',
      duration: 1800, // 30 minutes in seconds
      uploaded_by: testUserId
    };
  });

  afterEach(resetDB);

  it('should create a video with all fields', async () => {
    const result = await createVideo(testInput);

    expect(result.id).toBeDefined();
    expect(result.study_center_id).toEqual(testStudyCenterId);
    expect(result.title).toEqual('Introduction to Quran Reading');
    expect(result.description).toEqual('Basic Quran reading techniques for beginners');
    expect(result.file_url).toEqual('https://example.com/videos/quran-intro.mp4');
    expect(result.duration).toEqual(1800);
    expect(result.uploaded_by).toEqual(testUserId);
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a video with minimal fields (null description and duration)', async () => {
    const minimalInput: CreateVideoInput = {
      study_center_id: testStudyCenterId,
      title: 'Simple Video',
      description: null,
      file_url: 'https://example.com/videos/simple.mp4',
      duration: null,
      uploaded_by: testUserId
    };

    const result = await createVideo(minimalInput);

    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Simple Video');
    expect(result.description).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.file_url).toEqual('https://example.com/videos/simple.mp4');
    expect(result.is_active).toBe(true);
  });

  it('should save video to database', async () => {
    const result = await createVideo(testInput);

    const videos = await db.select()
      .from(videosTable)
      .where(eq(videosTable.id, result.id))
      .execute();

    expect(videos).toHaveLength(1);
    expect(videos[0].title).toEqual('Introduction to Quran Reading');
    expect(videos[0].description).toEqual('Basic Quran reading techniques for beginners');
    expect(videos[0].file_url).toEqual('https://example.com/videos/quran-intro.mp4');
    expect(videos[0].duration).toEqual(1800);
    expect(videos[0].study_center_id).toEqual(testStudyCenterId);
    expect(videos[0].uploaded_by).toEqual(testUserId);
    expect(videos[0].is_active).toBe(true);
  });

  it('should reject video creation for non-existent study center', async () => {
    const invalidInput = {
      ...testInput,
      study_center_id: 99999
    };

    await expect(createVideo(invalidInput)).rejects.toThrow(/study center not found/i);
  });

  it('should reject video creation for inactive study center', async () => {
    // Make study center inactive
    await db.update(studyCentersTable)
      .set({ is_active: false })
      .where(eq(studyCentersTable.id, testStudyCenterId))
      .execute();

    await expect(createVideo(testInput)).rejects.toThrow(/study center not found or inactive/i);
  });

  it('should reject video creation for non-existent user', async () => {
    const invalidInput = {
      ...testInput,
      uploaded_by: 99999
    };

    await expect(createVideo(invalidInput)).rejects.toThrow(/user not found/i);
  });

  it('should reject video creation for inactive user', async () => {
    // Make user inactive
    await db.update(usersTable)
      .set({ is_active: false })
      .where(eq(usersTable.id, testUserId))
      .execute();

    await expect(createVideo(testInput)).rejects.toThrow(/user not found or inactive/i);
  });

  it('should handle different video duration formats', async () => {
    const testCases = [
      { duration: 0, description: 'zero duration' },
      { duration: 60, description: 'one minute' },
      { duration: 3600, description: 'one hour' },
      { duration: 7200, description: 'two hours' }
    ];

    for (const testCase of testCases) {
      const input = {
        ...testInput,
        title: `Video with ${testCase.description}`,
        duration: testCase.duration
      };

      const result = await createVideo(input);
      expect(result.duration).toEqual(testCase.duration);
      expect(result.title).toEqual(`Video with ${testCase.description}`);
    }
  });

  it('should handle various file URL formats', async () => {
    const urlTestCases = [
      'https://example.com/video.mp4',
      'https://storage.example.com/folder/subfolder/video.avi',
      'https://cdn.example.com/videos/religious/quran-lesson-1.mov'
    ];

    for (const url of urlTestCases) {
      const input = {
        ...testInput,
        title: `Video for ${url}`,
        file_url: url
      };

      const result = await createVideo(input);
      expect(result.file_url).toEqual(url);
    }
  });
});