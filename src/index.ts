import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';

// -----------------------------------------------------------------
// 1. Interfaces
// -----------------------------------------------------------------
export interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
}

interface Category { 
  id: string; 
  name: string; 
}

interface Project { 
  id: string; 
  title: string; 
  description: string; 
  image: string; 
  category_id: string; 
}

interface Track { 
  id: number; 
  title: string; 
  artist: string; 
  src: string; 
  project_id: string; 
}

// -----------------------------------------------------------------
// 2. สร้าง Elysia App Factory Function
// -----------------------------------------------------------------
// ใช้ function เพื่อสร้าง app ใหม่ทุกครั้งที่มี request เข้ามา
// และส่ง env เข้าไปใน state
const createApp = (env: Env) => {
  return new Elysia({ aot: false })
    .use(cors())
    // เก็บ env ไว้ใน state เพื่อให้ทุก handler เข้าถึงได้
    .state('env', env)
    .decorate('db', env.DB) // วิธีที่ 2: ใช้ decorate (แนะนำ)
    
    // -----------------------------------------------------------------
    // 3. GET Portfolio Endpoint
    // -----------------------------------------------------------------
    .get('/api/v1/portfolio', async ({ store, db }) => {
      try {
        // วิธีที่ 1: เข้าถึงผ่าน store
        // const database = (store.env as Env).DB;
        
        // วิธีที่ 2: เข้าถึงผ่าน db ที่ decorate ไว้ (สะดวกกว่า)
        const database = db as D1Database;
        
        // Query ข้อมูล
        const { results: categories } = await database
          .prepare("SELECT * FROM Category")
          .all<Category>();
          
        const { results: projects } = await database
          .prepare("SELECT * FROM Project")
          .all<Project>();
          
        const { results: tracks } = await database
          .prepare("SELECT * FROM Track")
          .all<Track>();

        // ประกอบข้อมูล
        const portfolioData = categories.map(category => {
          const categoryProjects = projects
            .filter(p => p.category_id === category.id)
            .map(project => {
              const projectTracks = tracks
                .filter(t => t.project_id === project.id)
                .map(track => ({
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
            
          return {
            category: category.name,
            items: categoryProjects
          };
        });

        return portfolioData;

      } catch (e: any) {
        console.error('D1 Query Error:', e.message, e.stack);
        return new Response(
          JSON.stringify({ 
            error: e.message, 
            stack: e.stack 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    })
    
    // -----------------------------------------------------------------
    // 4. Health Check Endpoint
    // -----------------------------------------------------------------
    .get('/health', () => ({ status: 'ok' }));
};

// -----------------------------------------------------------------
// 5. Export Worker (แก้ไขตรงนี้สำคัญมาก!)
// -----------------------------------------------------------------
export default {
  async fetch(
    request: Request, 
    env: Env, 
    ctx: ExecutionContext
  ): Promise<Response> {
    // สร้าง app instance ใหม่ทุกครั้ง และส่ง env เข้าไป
    const app = createApp(env);
    
    // เรียก fetch โดยไม่ต้องส่ง env ซ้ำ (เพราะเก็บใน state แล้ว)
    return app.fetch(request);
  },
};