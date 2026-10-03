/**
 * Modular Video Storage Provider Abstraction
 * Supports Supabase Storage, S3/Cloud Storage, or Local/CDN development storage.
 * Keeps storage implementations decoupled from player components.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';

export interface StorageUploadOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface VideoStorageProvider {
  name: string;
  upload(file: Buffer | Uint8Array, path: string, options?: StorageUploadOptions): Promise<string>;
  delete(path: string): Promise<boolean>;
  getUrl(path: string): string;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Supabase Storage Implementation for Video & Manifest Assets
 */
export class SupabaseVideoStorageProvider implements VideoStorageProvider {
  name = 'supabase-storage';
  private bucket: string;

  constructor(bucket: string = 'videos') {
    this.bucket = bucket;
  }

  async upload(
    file: Buffer | Uint8Array,
    path: string,
    options?: StorageUploadOptions
  ): Promise<string> {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.storage.from(this.bucket).upload(path, file, {
      contentType: options?.contentType || 'video/mp4',
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert ?? true,
    });

    if (error || !data) {
      throw new Error(`[SupabaseStorage] Upload failed: ${error?.message}`);
    }

    return this.getUrl(path);
  }

  async delete(path: string): Promise<boolean> {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.storage.from(this.bucket).remove([path]);
    return !error;
  }

  getUrl(path: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/${this.bucket}/${path.replace(/^\/+/, '')}`;
  }

  async getSignedUrl(path: string, expiresInSeconds: number = 3600): Promise<string> {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`[SupabaseStorage] Failed to create signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }
}

/**
 * Local / Public CDN Storage Implementation for Development & Test Videos
 */
export class LocalVideoStorageProvider implements VideoStorageProvider {
  name = 'local-storage';
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async upload(): Promise<string> {
    throw new Error('Local video upload is not supported in browser runtime. Use server storage adapter.');
  }

  async delete(): Promise<boolean> {
    return true;
  }

  getUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  async getSignedUrl(path: string): Promise<string> {
    return this.getUrl(path);
  }
}

/**
 * Factory to retrieve the active storage provider
 */
export function getVideoStorageProvider(): VideoStorageProvider {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseVideoStorageProvider('videos');
  }
  return new LocalVideoStorageProvider();
}
