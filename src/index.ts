import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';

// -----------------------------------------------------------------
// 1. Interfaces
// -----------------------------------------------------------------
export interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
}

interface Category { id: string; name: string; }
interface Project { id: string; title: string; description: string; image: string; category_id: string; }
interface Track { id: number; title: string; artist: string; src: string; project_id: string; }


// -----------------------------------------------------------------
// 2. สร้าง Elysia App Factory Function (รับ env เข้ามา)
// -----------------------------------------------------------------
const createApp = (env: Env) => {
  return new Elysia({ aot: false })
    .use(cors())
    // ✅ หัวใจหลัก: ผูก DB และ Token เข้ากับ Context ของ Elysia
    // นี่คือวิธีแก้ Bug Reading 'DB' ที่ถูกต้องที่สุด
    .decorate('db', env.DB) 
    .decorate('adminToken', env.ADMIN_TOKEN) 
    
    // -----------------------------------------------------------------
    // 3. GET Portfolio Endpoint (Public)
    // -----------------------------------------------------------------
    .get('/api/v1/portfolio', async ({ db }) => {
      // Handler เข้าถึง DB ได้โดยตรงผ่าน { db }
      try {
        const database = db as D1Database;
        const { results: categories } = await database.prepare("SELECT * FROM Category").all<Category>();
        const { results: projects } = await database.prepare("SELECT * FROM Project").all<Project>();
        const { results: tracks } = await database.prepare("SELECT * FROM Track").all<Track>();

        // โค้ดประกอบข้อมูล (JavaScript Join Logic)
        const portfolioData = categories.map(category => {
          const categoryProjects = projects
            .filter(p => p.category_id === category.id)
            .map(project => {
              const projectTracks = tracks.filter(t => t.project_id === project.id).map(track => ({
                  title: track.title,
                  artist: track.artist,
                  src: track.src
              }));
              return {
                id: project.id, title: project.title, description: project.description, image: project.image, tracks: projectTracks
              };
            });
          return { category: category.name, items: categoryProjects };
        });
        return portfolioData;

      } catch (e: any) {
        // Log Error จริงๆ ออกมา
        console.error('D1 Query Error:', e.message, e.stack);
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { 
          status: 500, headers: { 'Content-Type': 'application/json' } 
        });
      }
    })
    
    // -----------------------------------------------------------------
    // 4. ADMIN API Endpoints
    // -----------------------------------------------------------------
    .group('/api/admin', (adminGroup) => 
      adminGroup
        // Middleware: ตรวจสอบ Token (เข้าถึง Token ผ่าน { store })
        .onRequest(({ request, store, set }) => {
          const adminToken = (store as { adminToken: string }).adminToken; // ดึง Token ที่ถูก decorate ไว้
          const authHeader = request.headers.get('Authorization');
          const expectedToken = `Bearer ${adminToken}`;
          
          if (!authHeader || authHeader !== expectedToken) {
            set.status = 401;
            return { error: 'Invalid admin token' };
          }
        })
        
        // GET /api/admin/projects (ตัวอย่างที่ Next.js Admin UI เรียก)
        .get('/projects', async ({ db, set }) => {
            try {
              const database = db as D1Database;
              const { results: categories } = await database.prepare("SELECT id, name FROM Category").all<Category>();
              const { results: projects } = await database.prepare("SELECT * FROM Project").all<Project>();
              const { results: tracks } = await database.prepare("SELECT * FROM Track").all<Track>();
              
              const projectsWithDetails = projects.map(project => {
                  const categoryName = categories.find(c => c.id === project.category_id)?.name || 'N/A';
                  const projectTracks = tracks.filter(t => t.project_id === project.id);
                  return { ...project, categoryName: categoryName, trackCount: projectTracks.length };
              });
              return projectsWithDetails;

            } catch (e: any) {
              set.status = 500;
              return { error: e.message };
            }
        })
        
        // ... (Endpoint อื่นๆ ที่ถูกตัดออก) ...
        .post('/project', async ({ body, db, set }) => {
           // ... (โค้ด POST INSERT) ...
            return { success: true, message: "OK" }; // (ตัวอย่าง)
        }, { body: t.Object({ /* ... (Validator) ... */ }) })
    ) // สิ้นสุด adminGroup
}; // สิ้นสุด createApp

// -----------------------------------------------------------------
// 5. Export Worker (Final Setup)
// -----------------------------------------------------------------
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // ✅ สร้าง app instance ใหม่สำหรับทุก Request และส่ง env เข้าไป
    const app = createApp(env);
    
    // ✅ เรียก fetch โดยไม่ต้องส่ง env ซ้ำ
    return app.fetch(request);
  },
};