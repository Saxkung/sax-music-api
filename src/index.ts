/* sax-music-api/src/index.ts (อัปเดต Helper Function) */
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
  BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_visible: boolean;
}
interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category_id: string;
  display_order: number;
  is_published: boolean;
}
interface Track {
  id: number;
  title: string;
  artist: string;
  src: string;
  project_id: string;
  display_order: number;
  duration: number;
}

// ✅ Helper Function สำหรับตรวจสอบ Auth
const checkAuth = (request: Request, env: Env): boolean => {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${env.ADMIN_TOKEN}`;
  return Boolean(env.ADMIN_TOKEN) && authHeader === expectedToken;
};

function validMediaUrl(value: unknown, env: Env): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      [new URL(env.R2_PUBLIC_URL).origin, 'https://saxmusic.work'].includes(url.origin);
  } catch { return false; }
}

// ⭐️ --- Helper: ฟังก์ชันย้ายไฟล์ใน R2 (เวอร์ชันอัปเดต Path) ---
async function handleR2Rename(
  env: Env,
  tempImageKey: string, // e.g., "uploads/temp_12345.jpg"
  projectId: string,    // e.g., "tee_yod_98765"
  currentImageUrl: string // URL เก่า (ถ้ามี)
): Promise<string> {
  // ถ้าไม่มี tempKey (ไม่ได้อัปโหลดรูปใหม่) ให้ใช้ URL เดิม
  if (!tempImageKey) {
    return currentImageUrl;
  }

  if (!/^uploads\/[a-zA-Z0-9_.-]+$/.test(tempImageKey) || !/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    throw new Error('Invalid image upload');
  }

  try {
    // 1. แยกชื่อไฟล์ดั้งเดิมจาก tempKey
    // (เราจะเก็บชื่อไฟล์เดิมที่ผู้ใช้อัปโหลด)
    const originalFilename = tempImageKey.split('/').pop() || 'image.jpg';

    // 2. ⭐️ สร้าง Key ใหม่ตามที่คุณต้องการ: "img/[projectId]/[filename]"
    const newKey = `img/${projectId}/${originalFilename}`;
    const publicUrl = `${env.R2_PUBLIC_URL}/${newKey}`;

    // 3. Copy/Put ไฟล์จาก temp path ไปยัง path ใหม่
    const obj = await env.BUCKET.get(tempImageKey);
    if (!obj) {
      throw new Error('Temp file not found in R2');
    }

    await env.BUCKET.put(newKey, obj.body, {
      httpMetadata: obj.httpMetadata,
      customMetadata: obj.customMetadata,
    });

    // Keep previous covers until a deliberate cleanup; failed saves must not destroy them.

    return publicUrl; // คืน URL ใหม่
  } catch (e: any) {
    console.error(`R2 Rename Failed: ${e.message}`);
    // ถ้าพลาด ให้อย่างน้อยก็คืน URL ชั่วคราวไปก่อน (ดีกว่าเสียรูปไป)
    return `${env.R2_PUBLIC_URL}/${tempImageKey}`;
  }
}

// ⭐️ --- จบ Helper ---

const createApp = (env: Env) => {
  return (
    new Elysia({ aot: false })
      .use(cors({ origin: ['https://saxmusic.work', 'https://www.saxmusic.work', 'https://admin.saxmusic.work', 'http://localhost:5173', 'http://localhost:3000'] }))
      .onRequest(({ request, set }) => {
        set.headers['X-Content-Type-Options'] = 'nosniff';
        if (new URL(request.url).pathname.startsWith('/api/admin/')) {
          set.headers['Cache-Control'] = 'no-store';
          if (request.method !== 'OPTIONS' && !checkAuth(request, env)) { set.status = 401; return { error: 'Unauthorized' }; }
          if (Number(request.headers.get('content-length')) > 52 * 1024 * 1024) { set.status = 413; return { error: 'Each file must be 50 MB or smaller.' }; }
        }
      })
      .onError(({ code, set }) => {
        set.status = code === 'NOT_FOUND' ? 404 : code === 'PARSE' || code === 'VALIDATION' ? 400 : 500;
        return { error: code === 'NOT_FOUND' ? 'Not found' : 'Unable to complete the request. Try again.' };
      })

      // ✅ TEST ROUTE (Public)
      .get('/test', () => {
        return {
          status: 'OK',
          message: 'Worker updated successfully!',
          timestamp: new Date().toISOString(),
        };
      })

      // ✅ PUBLIC ROUTE - Portfolio
      .get('/api/v1/portfolio', async () => {
        try {
          const database = env.DB;

          const { results: categories } = await database
            .prepare(
              'SELECT * FROM Category WHERE is_visible = 1 ORDER BY display_order ASC'
            )
            .all<Category>();
          const { results: projects } = await database
            .prepare(
              'SELECT * FROM Project WHERE is_published = 1 ORDER BY display_order ASC'
            )
            .all<Project>();
          const { results: tracks } = await database
            .prepare('SELECT * FROM Track ORDER BY display_order ASC')
            .all<Track>();

          const portfolioData = categories.map((category) => {
            const categoryProjects = projects
              .filter((p) => p.category_id === category.id)
              .map((project) => {
                const projectTracks = tracks
                  .filter((t) => t.project_id === project.id)
                  .map((track) => ({
                    title: track.title,
                    artist: track.artist,
                    src: track.src,
                  }));

                return {
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  image: project.image,
                  tracks: projectTracks,
                };
              });

            return {
              category: category.name,
              items: categoryProjects,
            };
          });

          return portfolioData;
        } catch (e: any) {
          return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })

      // 🔒 ADMIN ROUTE - Get All Projects (สำหรับหน้า Admin)
      .get('/api/admin/projects', async ({ request, set }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        try {
          const database = env.DB;

          const { results: categories } = await database
            .prepare('SELECT id, name FROM Category')
            .all<Category>();
          const { results: projects } = await database
            .prepare('SELECT * FROM Project ORDER BY category_id, display_order ASC')
            .all<Project>();
          const { results: tracks } = await database
            .prepare('SELECT project_id, COUNT(id) as trackCount FROM Track GROUP BY project_id')
            .all<{ project_id: string; trackCount: number }>();
            
          const trackCountMap = new Map(tracks.map(t => [t.project_id, t.trackCount]));

          const projectsWithDetails = projects.map((project) => {
            const categoryName =
              categories.find((c) => c.id === project.category_id)?.name || 'N/A';
            return {
              ...project,
              categoryName,
              trackCount: trackCountMap.get(project.id) || 0,
            };
          });

          return projectsWithDetails;
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // ============================================
      // 🗂️ CATEGORY MANAGEMENT APIs
      // ============================================

      // GET all categories
      .get('/api/admin/categories', async ({ request, set }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { results } = await env.DB.prepare(
            'SELECT * FROM Category ORDER BY display_order ASC'
          ).all();
          return results;
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // POST create category
      .post('/api/admin/categories', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { id, name, display_order } = body as Category;
          await env.DB.prepare(
            "INSERT INTO Category (id, name, display_order, is_visible) VALUES (?, ?, ?, 1)"
          ).bind(id, name, display_order).run();
          return { success: true, id };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // PUT update category
      .put('/api/admin/categories/:id', async ({ request, set, params, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        try {
          const { id } = params;
          const { name, is_visible } = body as {
            name?: string;
            is_visible?: boolean;
          };

          const updates: string[] = [];
          const values: any[] = [];

          if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
          }
          if (is_visible !== undefined) {
            updates.push('is_visible = ?');
            values.push(is_visible ? 1 : 0);
          }
          
          if (updates.length === 0) {
            set.status = 400;
            return { error: "No fields to update" };
          }

          values.push(id);
          await env.DB.prepare(
            `UPDATE Category SET ${updates.join(', ')} WHERE id = ?`
          )
            .bind(...values)
            .run();

          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // DELETE category
      .delete('/api/admin/categories/:id', async ({ request, set, params }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        try {
          const { id } = params;
          const { results } = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM Project WHERE category_id = ?'
          )
            .bind(id)
            .all<{ count: number }>();

          if (results[0].count > 0) {
            set.status = 400;
            return { error: 'Cannot delete category with existing projects' };
          }

          await env.DB.prepare('DELETE FROM Category WHERE id = ?').bind(id).run();
          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })
      
      // ⭐️ NEW: PATCH reorder categories
      .patch('/api/admin/categories/reorder', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { items } = body as { items: Array<{ id: string; display_order: number }> };
          const db = env.DB;
          const stmts = items.map(item => 
            db.prepare("UPDATE Category SET display_order = ? WHERE id = ?").bind(item.display_order, item.id)
          );
          await db.batch(stmts);
          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // ========================================
      // 📁 PROJECT MANAGEMENT APIs
      // ========================================

      // POST create project
      .post('/api/admin/projects', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const {
            id,
            title,
            description,
            category_id,
            display_order = 0,
            tempImageKey,
            image = '',
            is_published = false,
          } = body as {
            id: string;
            title: string;
            description?: string;
            category_id: string;
            display_order?: number;
            tempImageKey?: string;
            image?: string;
            is_published?: boolean;
          };

          if (!id || !title || !category_id) {
            set.status = 400;
            return { error: 'id, title, and category_id are required' };
          }

          if ((image && !validMediaUrl(image, env)) || (is_published && !image && !tempImageKey)) {
            set.status = 400;
            return { error: `Add a cover from ${new URL(env.R2_PUBLIC_URL).hostname} before publishing.` };
          }

          // ⭐️ ย้ายไฟล์ใน R2 และเอา URL ใหม่ (ส่ง ID ที่ Frontend สร้างไป)
          const finalImageUrl = await handleR2Rename(
            env,
            tempImageKey || '',
            id, // projectId
            image
          );

          await env.DB.prepare(
            'INSERT INTO Project (id, title, description, image, category_id, display_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
            .bind(
              id,
              title,
              description || '',
              finalImageUrl, // ⭐️ ใช้ URL ใหม่
              category_id,
              display_order,
              is_published ? 1 : 0
            )
            .run();

          return { success: true, id };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // ⭐️ PUT update project (ใช้ Helper ใหม่)
      .put('/api/admin/projects/:id', async ({ request, set, params, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { id } = params; // projectId
          const {
            title,
            description,
            image, // URL ปัจจุบัน
            category_id,
            display_order,
            is_published,
            tempImageKey, // Key ชั่วคราว (ถ้ามีการอัปโหลดใหม่)
          } = body as {
            title?: string;
            description?: string;
            image?: string;
            category_id?: string;
            display_order?: number;
            is_published?: boolean;
            tempImageKey?: string;
          };

          // ⭐️ ย้ายไฟล์ใน R2 (ถ้ามี) และเอา URL สุดท้าย
          if (image && !validMediaUrl(image, env)) {
            set.status = 400;
            return { error: `Use a cover URL from ${new URL(env.R2_PUBLIC_URL).hostname}.` };
          }
          const current = await env.DB.prepare('SELECT image, is_published FROM Project WHERE id = ?').bind(id).first<{ image: string; is_published: number }>();
          if (!current) { set.status = 404; return { error: 'Project not found.' }; }
          if ((is_published ?? Boolean(current.is_published)) && !(image ?? current.image) && !tempImageKey) {
            set.status = 400;
            return { error: 'Add a cover before publishing.' };
          }
          const finalImageUrl = await handleR2Rename(
            env,
            tempImageKey || '',
            id, // projectId
            image ?? current.image
          );

          const updates: string[] = [];
          const values: any[] = [];

          if (title !== undefined) updates.push('title = ?'), values.push(title);
          if (description !== undefined) updates.push('description = ?'), values.push(description);
          
          // Publishing or reordering must preserve the existing cover.
          if (image !== undefined || tempImageKey) {
            updates.push('image = ?'), values.push(finalImageUrl);
          }

          if (category_id !== undefined) updates.push('category_id = ?'), values.push(category_id);
          if (display_order !== undefined) updates.push('display_order = ?'), values.push(display_order);
          if (is_published !== undefined) updates.push('is_published = ?'), values.push(is_published ? 1 : 0);

          if (updates.length === 0) {
            set.status = 400;
            return { error: "No fields to update" };
          }
          
          updates.push("updated_at = datetime('now')");
          values.push(id);

          await env.DB.prepare(
            `UPDATE Project SET ${updates.join(', ')} WHERE id = ?`
          )
            .bind(...values)
            .run();

          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // DELETE project
      .delete('/api/admin/projects/:id', async ({ request, set, params }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { id } = params;
          // CASCADE จะลบ tracks ออกอัตโนมัติ
          await env.DB.prepare('DELETE FROM Project WHERE id = ?').bind(id).run();
          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // ⭐️ NEW: PATCH reorder projects
      .patch('/api/admin/projects/reorder', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { items } = body as { items: Array<{ id: string; display_order: number }> };
          const db = env.DB;
          const stmts = items.map(item => 
            db.prepare("UPDATE Project SET display_order = ? WHERE id = ?").bind(item.display_order, item.id)
          );
          await db.batch(stmts);
          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })


      // ============================================
      // 🎵 TRACK MANAGEMENT APIs
      // ============================================

      // GET tracks by project_id
      .get('/api/admin/tracks/:project_id', async ({ request, set, params }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { project_id } = params;
          const { results } = await env.DB.prepare(
            'SELECT * FROM Track WHERE project_id = ? ORDER BY display_order ASC'
          )
            .bind(project_id)
            .all<Track>();
          return results;
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // POST create track
      .post('/api/admin/tracks', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const {
            title,
            artist,
            src,
            project_id,
            display_order = 0,
            duration = 0,
          } = body as {
            title: string;
            artist?: string;
            src: string;
            project_id: string;
            display_order?: number;
            duration?: number;
          };

          if (!title || !src || !project_id) {
            set.status = 400;
            return { error: 'title, src, and project_id are required' };
          }

          if (!validMediaUrl(src, env)) { set.status = 400; return { error: `Use an audio URL from ${new URL(env.R2_PUBLIC_URL).hostname}.` }; }

          const result = await env.DB.prepare(
            'INSERT INTO Track (title, artist, src, project_id, display_order, duration) VALUES (?, ?, ?, ?, ?, ?)'
          )
            .bind(title, artist || '', src, project_id, display_order, duration)
            .run();

          return { success: true, id: result.meta.last_row_id };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // PUT update track
      .put('/api/admin/tracks/:id', async ({ request, set, params, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        try {
          const { id } = params;
          const { title, artist, src, display_order, duration } = body as {
            title?: string;
            artist?: string;
            src?: string;
            display_order?: number;
            duration?: number;
          };

          if (src !== undefined && !validMediaUrl(src, env)) { set.status = 400; return { error: `Use an audio URL from ${new URL(env.R2_PUBLIC_URL).hostname}.` }; }

          const updates: string[] = [];
          const values: any[] = [];

          if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
          }
          if (artist !== undefined) {
            updates.push('artist = ?');
            values.push(artist);
          }
          if (src !== undefined) {
            updates.push('src = ?');
            values.push(src);
          }
          if (display_order !== undefined) {
            updates.push('display_order = ?');
            values.push(display_order);
          }
          if (duration !== undefined) {
            updates.push('duration = ?');
            values.push(duration);
          }
          
          if (updates.length === 0) {
            set.status = 400;
            return { error: "No fields to update" };
          }

          values.push(parseInt(id));
          await env.DB.prepare(
            `UPDATE Track SET ${updates.join(', ')} WHERE id = ?`
          )
            .bind(...values)
            .run();

          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // DELETE track
      .delete('/api/admin/tracks/:id', async ({ request, set, params }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { id } = params;
          const trackId = parseInt(id);
          if (isNaN(trackId)) {
            set.status = 400;
            return { error: 'Invalid track ID' };
          }
          await env.DB.prepare('DELETE FROM Track WHERE id = ?').bind(trackId).run();
          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })
      
      // ⭐️ NEW: PATCH reorder tracks
      .patch('/api/admin/tracks/reorder', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        try {
          const { items } = body as { items: Array<{ id: number; display_order: number }> };
          const db = env.DB;
          const stmts = items.map(item => 
            db.prepare("UPDATE Track SET display_order = ? WHERE id = ?").bind(item.display_order, item.id)
          );
          await db.batch(stmts);
          return { success: true };
        } catch (e: any) {
          set.status = 500;
          return { error: 'Unable to complete the request. Try again.' };
        }
      })

      // ============================================
      // 📤 R2 UPLOAD APIs
      // ============================================

      .post('/api/admin/upload/presign', ({ request, set }) => {
        if (!checkAuth(request, env)) { set.status = 401; return { error: 'Unauthorized' }; }
        set.status = 410;
        return { error: 'Use authenticated direct upload for files up to 50 MB.' };
      })
      .post('/api/admin/upload/direct', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) { set.status = 401; return { error: 'Unauthorized' }; }
        const { file, bundle, relativePath } = body as { file: File; bundle?: string; relativePath?: string };
        if (!file || typeof file.stream !== 'function' || !file.size) { set.status = 400; return { error: 'Choose a file to upload.' }; }
        if (file.size > 50 * 1024 * 1024) { set.status = 413; return { error: 'Each file must be 50 MB or smaller.' }; }
        const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac', ogg: 'audio/ogg', opus: 'audio/ogg', m3u8: 'application/vnd.apple.mpegurl', ts: 'video/mp2t', mp4: 'video/mp4', m4s: 'video/iso.segment', json: 'application/json' };
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const contentType = types[extension];
        if (!contentType) { set.status = 400; return { error: 'Choose an image, audio file, or HLS package.' }; }
        if (contentType.startsWith('image/') && file.size > 5 * 1024 * 1024) { set.status = 413; return { error: 'Cover images must be 5 MB or smaller.' }; }
        let key: string;
        if (bundle && relativePath) {
          if (!/^[a-f0-9-]{36}$/.test(bundle) || relativePath.length > 512 || relativePath.split('/').some(part => !part || part === '.' || part === '..' || /[\\\x00-\x1f?#]/.test(part))) { set.status = 400; return { error: 'Invalid HLS package path.' }; }
          key = 'hls/' + bundle + '/' + relativePath;
        } else key = 'uploads/' + crypto.randomUUID() + '_' + file.name.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-160);
        try {
          await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' } });
          return { success: true, key, url: env.R2_PUBLIC_URL + '/' + key.split('/').map(encodeURIComponent).join('/') };
        } catch { set.status = 500; return { error: 'Upload failed. Try again.' }; }
      })
  );
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const app = createApp(env);
    return app.handle(request);
  },
};
