import { db } from '../db';
import { videosTable } from '../db/schema';
import { type Video } from '../schema';

export const getVideos = async (): Promise<Video[]> => {
  try {
    const results = await db.select()
      .from(videosTable)
      .execute();

    return results.map(video => ({
      ...video,
      created_at: new Date(video.created_at),
      updated_at: new Date(video.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    throw error;
  }
};