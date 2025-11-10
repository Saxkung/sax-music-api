import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
}

interface Category { id: string; name: string; }
interface Project { id: string; title: string; description: string; image: string; category_id: string; }
interface Track { id: number; title: string; artist: string; src: string; project_id: string; }

// ✅ Helper Function สำหรับตรวจสอบ Auth
const checkAuth = (request: Request, env: Env): boolean => {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${env.ADMIN_TOKEN}`;
  return authHeader === expectedToken;
};

const createApp = (env: Env) => {
  return new Elysia({ aot: false })
    .use(cors())
    
    // ✅ TEST ROUTE (Public)
    .get('/test', () => {
      return { 
        status: 'OK', 
        message: 'Worker updated successfully!',
        timestamp: new Date().toISOString()
      };
    })
    
    // ✅ PUBLIC ROUTE - Portfolio
    .get('/api/v1/portfolio', async () => {
      try {
        const database = env.DB;
        
        const { results: categories } = await database.prepare("SELECT * FROM Category").all<Category>();
        const { results: projects } = await database.prepare("SELECT * FROM Project").all<Project>();
        const { results: tracks } = await database.prepare("SELECT * FROM Track").all<Track>();

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
        return new Response(
          JSON.stringify({ error: e.message }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    })
    
    // 🔒 ADMIN ROUTE - Get Projects (ตรวจสอบ Auth ใน Handler เอง)
    .get('/api/admin/projects', async ({ request, set }) => {
      // ตรวจสอบ Auth
      if (!checkAuth(request, env)) {
        set.status = 401;
        return { 
          error: 'Invalid admin token',
          debug: { receivedHeader: request.headers.get('Authorization') ? 'present' : 'missing' }
        };
      }
      
      try {
        const database = env.DB;
        
        const { results: categories } = await database.prepare("SELECT id, name FROM Category").all<Category>();
        const { results: projects } = await database.prepare("SELECT * FROM Project").all<Project>();
        const { results: tracks } = await database.prepare("SELECT * FROM Track").all<Track>();
        
        const projectsWithDetails = projects.map(project => {
          const categoryName = categories.find(c => c.id === project.category_id)?.name || 'N/A';
          const projectTracks = tracks.filter(t => t.project_id === project.id);
          return { 
            ...project, 
            categoryName, 
            trackCount: projectTracks.length 
          };
        });
        
        return projectsWithDetails;

      } catch (e: any) {
        set.status = 500;
        return { error: e.message };
      }
    })
    
    // 🔒 ADMIN ROUTE - Create Project
    .post('/api/admin/project', async ({ request, body, set }) => {
      // ตรวจสอบ Auth
      if (!checkAuth(request, env)) {
        set.status = 401;
        return { 
          error: 'Invalid admin token',
          debug: { receivedHeader: request.headers.get('Authorization') ? 'present' : 'missing' }
        };
      }
      
      try {
        const database = env.DB;
        // INSERT logic here
        return { success: true, message: "Project created" };
      } catch (e: any) {
        set.status = 500;
        return { error: e.message };
      }
    });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const app = createApp(env);
    return app.fetch(request);
  },
};