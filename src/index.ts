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
  return authHeader === expectedToken;
};

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

    // 4. ลบไฟล์ชั่วคราว
    await env.BUCKET.delete(tempImageKey);

    // 5. (Optional) ลบรูปเก่า (ถ้ามี และไม่ใช่รูปใหม่)
    if (
      currentImageUrl &&
      currentImageUrl.includes(env.R2_PUBLIC_URL) &&
      !currentImageUrl.includes('/uploads/') // ไม่ใช่ URL temp
    ) {
      try {
        const oldKey = currentImageUrl.replace(env.R2_PUBLIC_URL + '/', '');
        if (oldKey !== newKey) {
          await env.BUCKET.delete(oldKey);
        }
      } catch (e) {
        console.error('Failed to delete old image:', e);
      }
    }

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
      .use(cors())

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
          return new Response(JSON.stringify({ error: e.message }), {
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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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
            tempImageKey, // ⭐️ รับ Key ชั่วคราว
          } = body as {
            id: string;
            title: string;
            description?: string;
            category_id: string;
            display_order?: number;
            tempImageKey?: string;
          };

          if (!id || !title || !category_id) {
            set.status = 400;
            return { error: 'id, title, and category_id are required' };
          }

          // ⭐️ ย้ายไฟล์ใน R2 และเอา URL ใหม่ (ส่ง ID ที่ Frontend สร้างไป)
          const finalImageUrl = await handleR2Rename(
            env,
            tempImageKey || '',
            id, // projectId
            ''  // URL เก่า (ยังไม่มี)
          );

          await env.DB.prepare(
            'INSERT INTO Project (id, title, description, image, category_id, display_order, is_published) VALUES (?, ?, ?, ?, ?, ?, 1)'
          )
            .bind(
              id,
              title,
              description || '',
              finalImageUrl, // ⭐️ ใช้ URL ใหม่
              category_id,
              display_order
            )
            .run();

          return { success: true, id };
        } catch (e: any) {
          set.status = 500;
          return { error: e.message };
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
          const finalImageUrl = await handleR2Rename(
            env,
            tempImageKey || '',
            id, // projectId
            image || '' // URL เก่า
          );

          const updates: string[] = [];
          const values: any[] = [];

          if (title !== undefined) updates.push('title = ?'), values.push(title);
          if (description !== undefined) updates.push('description = ?'), values.push(description);
          
          // ⭐️ อัปเดต 'image' ด้วย URL สุดท้ายเสมอ
          updates.push('image = ?'), values.push(finalImageUrl);

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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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

          const result = await env.DB.prepare(
            'INSERT INTO Track (title, artist, src, project_id, display_order, duration) VALUES (?, ?, ?, ?, ?, ?)'
          )
            .bind(title, artist || '', src, project_id, display_order, duration)
            .run();

          return { success: true, id: result.meta.last_row_id };
        } catch (e: any) {
          set.status = 500;
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
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
          return { error: e.message };
        }
      })

      // ============================================
      // 📤 R2 UPLOAD APIs
      // ============================================

      // POST - Get Pre-signed URL for large files (PUT)
      .post('/api/admin/upload/presign', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        try {
          const { filename, contentType } = body as {
            filename: string;
            contentType: string;
          };

          if (!filename || !contentType) {
            set.status = 400;
            return { error: 'filename and contentType are required' };
          }

          const timestamp = Date.now();
          const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-_]/g, '_'); 
          const key = `uploads/${timestamp}_${sanitizedFilename}`;

          // สร้าง Pre-signed URL สำหรับ PUT (valid 1 hour)
          const signedUrl = await env.BUCKET.sign(key, 'PUT', {
             expires: 3600, // 1 ชั่วโมง
             httpMetadata: { contentType },
          });

          const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

          return {
            uploadUrl: signedUrl, // นี่คือ URL ที่จะใช้ PUT
            key: key,
            publicUrl: publicUrl,
          };
        } catch (e: any) {
          set.status = 500;
          return { error: `Failed to create presigned URL: ${e.message}` };
        }
      })

      // POST - Direct upload for small files (<5MB)
      // ⭐️⭐️⭐️ นี่คือเวอร์ชันที่แก้ไขแล้ว ⭐️⭐️⭐️
      .post('/api/admin/upload/direct', async ({ request, set, body }) => {
        if (!checkAuth(request, env)) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        try {
          console.log('[Worker] --- DIRECT UPLOAD V3 RUNNING ---'); // ⭐️ Log ใหม่
          
          // 'body' ที่ Elysia parse มาให้สำหรับ multipart/form-data คือ Object ธรรมดา
          const { file } = body as { file: File }; 

          if (!file || typeof file.arrayBuffer !== 'function') { 
            set.status = 400;
            console.error('[Worker] Body did not contain a valid file:', body);
            return { error: 'No file uploaded or body parse failed' };
          }
          
          console.log('[Worker] File received:', file.name, file.size, 'bytes');
          
          const MAX_SIZE = 5 * 1024 * 1024; 
          if (file.size > MAX_SIZE) {
            set.status = 413;
            return { error: `File size exceeds 5MB limit. Use pre-signed URL instead.` };
          }

          const timestamp = Date.now();
          const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-_]/g, '_');
          const key = `uploads/${timestamp}_${sanitizedFilename}`;

          const fileData = await file.arrayBuffer();
          console.log('[Worker] File data size:', fileData.byteLength, 'bytes');

          console.log('[Worker] Uploading to R2...');
          await env.BUCKET.put(key, fileData, {
            httpMetadata: {
              contentType: file.type,
              contentDisposition: `inline; filename="${file.name}"`
            },
          });

          const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
          console.log('[Worker] Upload successful:', publicUrl);

          return {
            success: true,
            key: key,
            url: publicUrl,
          };
        } catch (e: any) {
          console.error('[Worker] Direct upload failed:', e.message);
          console.error('[Worker] Error stack:', e.stack);
          set.status = 500;
          return { error: `Direct upload failed: ${e.message}` };
        }
      })
  );
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const app = createApp(env);
    return app.fetch(request, env);
  },
};