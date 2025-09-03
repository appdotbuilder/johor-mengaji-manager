import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studyCentersTable, videosTable } from '../db/schema';
import { getVideos } from '../handlers/get_videos';
import { eq } from 'drizzle-orm';

describe('getVideos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no videos exist', async () => {
    const result = await getVideos();
    expect(result).toEqual([]);
  });

  it('should fetch all videos from database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Admin User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Test Study Center',
        address: '123 Test Street',
        admin_id: user[0].id
      })
      .returning()
      .execute();

    // Create test videos
    const testVideos = [
      {
        study_center_id: studyCenter[0].id,
        title: 'Quran Recitation Basics',
        description: 'Introduction to proper Quran recitation',
        file_url: 'https://example.com/video1.mp4',
        duration: 1800,
        uploaded_by: user[0].id,
        is_active: true
      },
      {
        study_center_id: studyCenter[0].id,
        title: 'Arabic Grammar Lesson 1',
        description: 'Basic Arabic grammar concepts',
        file_url: 'https://example.com/video2.mp4',
        duration: 2400,
        uploaded_by: user[0].id,
        is_active: false
      }
    ];

    const insertedVideos = await db.insert(videosTable)
      .values(testVideos)
      .returning()
      .execute();

    // Test the handler
    const result = await getVideos();

    expect(result).toHaveLength(2);
    
    // Verify first video
    const video1 = result.find(v => v.title === 'Quran Recitation Basics');
    expect(video1).toBeDefined();
    expect(video1!.study_center_id).toBe(studyCenter[0].id);
    expect(video1!.description).toBe('Introduction to proper Quran recitation');
    expect(video1!.file_url).toBe('https://example.com/video1.mp4');
    expect(video1!.duration).toBe(1800);
    expect(video1!.uploaded_by).toBe(user[0].id);
    expect(video1!.is_active).toBe(true);
    expect(video1!.created_at).toBeInstanceOf(Date);
    expect(video1!.updated_at).toBeInstanceOf(Date);

    // Verify second video
    const video2 = result.find(v => v.title === 'Arabic Grammar Lesson 1');
    expect(video2).toBeDefined();
    expect(video2!.is_active).toBe(false);
    expect(video2!.duration).toBe(2400);
  });

  it('should return videos with correct data types', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Teacher User',
        role: 'pengajar_pusat'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Video Test Center',
        address: '456 Video Street',
        admin_id: user[0].id
      })
      .returning()
      .execute();

    await db.insert(videosTable)
      .values({
        study_center_id: studyCenter[0].id,
        title: 'Test Video',
        description: null,
        file_url: 'https://example.com/test.mp4',
        duration: null,
        uploaded_by: user[0].id
      })
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(1);
    const video = result[0];

    // Verify data types
    expect(typeof video.id).toBe('number');
    expect(typeof video.study_center_id).toBe('number');
    expect(typeof video.title).toBe('string');
    expect(video.description).toBeNull();
    expect(typeof video.file_url).toBe('string');
    expect(video.duration).toBeNull();
    expect(typeof video.uploaded_by).toBe('number');
    expect(typeof video.is_active).toBe('boolean');
    expect(video.created_at).toBeInstanceOf(Date);
    expect(video.updated_at).toBeInstanceOf(Date);
  });

  it('should fetch videos with all possible field values', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'uploader@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Video Uploader',
        role: 'admin_pusat'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Complete Test Center',
        address: '789 Complete Street',
        phone: '123-456-7890',
        email: 'center@test.com',
        registration_number: 'REG123',
        admin_id: user[0].id
      })
      .returning()
      .execute();

    // Insert video with all fields populated
    const testVideo = {
      study_center_id: studyCenter[0].id,
      title: 'Complete Video Test',
      description: 'A comprehensive test video with all fields',
      file_url: 'https://example.com/complete.mp4',
      duration: 3600,
      uploaded_by: user[0].id,
      is_active: true
    };

    await db.insert(videosTable)
      .values(testVideo)
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(1);
    const video = result[0];

    expect(video.title).toBe('Complete Video Test');
    expect(video.description).toBe('A comprehensive test video with all fields');
    expect(video.file_url).toBe('https://example.com/complete.mp4');
    expect(video.duration).toBe(3600);
    expect(video.is_active).toBe(true);
  });

  it('should verify videos are saved correctly in database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'verify@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Verification User',
        role: 'administrator'
      })
      .returning()
      .execute();

    const studyCenter = await db.insert(studyCentersTable)
      .values({
        name: 'Verification Center',
        address: '321 Verify Street',
        admin_id: user[0].id
      })
      .returning()
      .execute();

    await db.insert(videosTable)
      .values({
        study_center_id: studyCenter[0].id,
        title: 'Verification Video',
        description: 'Testing database storage',
        file_url: 'https://example.com/verify.mp4',
        duration: 900,
        uploaded_by: user[0].id
      })
      .execute();

    const result = await getVideos();
    const video = result[0];

    // Verify the video exists in the database by querying directly
    const dbVideos = await db.select()
      .from(videosTable)
      .where(eq(videosTable.id, video.id))
      .execute();

    expect(dbVideos).toHaveLength(1);
    expect(dbVideos[0].title).toBe('Verification Video');
    expect(dbVideos[0].description).toBe('Testing database storage');
    expect(dbVideos[0].file_url).toBe('https://example.com/verify.mp4');
    expect(dbVideos[0].duration).toBe(900);
    expect(dbVideos[0].created_at).toBeInstanceOf(Date);
    expect(dbVideos[0].updated_at).toBeInstanceOf(Date);
  });
});