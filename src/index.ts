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
// 2. สร้าง Elysia App Factory (รับ env เข้ามา)
// -----------------------------------------------------------------
const createApp = (env: Env) => {
  const app = new Elysia({ aot: false })
    .use(cors())
    .state('env', env)  // 🔑 inject env เข้า store ตั้งแต่ต้น!
    
    // -----------------------------------------------------------------
    // 3. GET Portfolio Endpoint (Public - ไม่ต้องใช้ Token)
    // -----------------------------------------------------------------
    .get('/api/v1/portfolio', async ({ store }) => {
      try {
        const env = store.env as Env;
        const database = env.DB;
        
        const { results: categories } = await database.prepare("SELECT * FROM Category").all<Category>();
        const { results: projects } = await database.prepare("SELECT * FROM Project").all<Project>();
        const { results: tracks } = await database.prepare("SELECT * FROM Track").all<Track>();

        // โค้ดประกอบข้อมูล
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
                id: project.id, 
                title: project.title, 
                description: project.description, 
                image: project.image, 
                tracks: projectTracks
              };
            });
          return { category: category.name, items: categoryProjects };
        });
        
        return portfolioData;

      } catch (e: any) {
        console.error('D1 Query Error:', e.message, e.stack);
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    })
    
    // -----------------------------------------------------------------
    // 4. ADMIN API Endpoints
    // -----------------------------------------------------------------
    .group('/api/admin', (adminGroup) => 
      adminGroup
        // Middleware: ตรวจสอบ Token
        .onRequest(({ request, store, set }) => {
          const env = store.env as Env;
          const authHeader = request.headers.get('Authorization');
          const expectedToken = `Bearer ${env.ADMIN_TOKEN}`;
          
          // 🔍 Debug: ดูค่าจริงๆ
          console.log('🔐 Auth Debug:', {
            received: authHeader,
            expected: expectedToken,
            match: authHeader === expectedToken
          });
          
          if (!authHeader || authHeader !== expectedToken) {
            set.status = 401;
            return { 
              error: 'Invalid admin token',
              debug: {
                receivedHeader: authHeader ? 'present' : 'missing',
                expectedFormat: 'Bearer <token>'
              }
            };
          }
        })
        
        // GET /api/admin/projects
        .get('/projects', async ({ store, set }) => {
          try {
            const env = store.env as Env;
            const database = env.DB;
            
            const { results: categories } = await database.prepare("SELECT id, name FROM Category").all<Category>();
            const { results: projects } = await database.prepare("SELECT * FROM Project").all<Project>();
            const { results: tracks } = await database.prepare("SELECT * FROM Track").all<Track>();
            
            const projectsWithDetails = projects.map(project => {
              const categoryName = categories.find(c => c.id === project.category_id)?.name || 'N/A';
              const projectTracks = tracks.filter(t => t.project_id === project.id);
              return { 
                ...project, 
                categoryName: categoryName, 
                trackCount: projectTracks.length 
              };
            });
            
            return projectsWithDetails;

          } catch (e: any) {
            console.error('Admin Projects Error:', e.message);
            set.status = 500;
            return { error: e.message };
          }
        })
        
        // POST /api/admin/project (ตัวอย่าง)
        .post('/project', async ({ body, store, set }) => {
          try {
            const env = store.env as Env;
            const database = env.DB;
            
            // ตัวอย่าง: INSERT logic ที่นี่
            // await database.prepare("INSERT INTO Project ...").run();
            
            return { success: true, message: "Project created" };
          } catch (e: any) {
            set.status = 500;
            return { error: e.message };
          }
        }, { 
          body: t.Object({ 
            title: t.String(),
            description: t.String(),
            image: t.String(),
            category_id: t.String()
          }) 
        })
    );
  return app;
};


// -----------------------------------------------------------------
// 5. Export Worker
// -----------------------------------------------------------------
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // ✅ สร้าง app ใหม่ทุก request พร้อม inject env
    const app = createApp(env);
    return app.fetch(request);
  },
};