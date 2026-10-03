import { env, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import worker, { type Env } from '../src/index';
import schema from '../schema.sql?raw';
const bindings = env as unknown as Env;
const origin = 'https://saxmusic.test';
function request(path: string, method = 'GET', data?: unknown) {
  return SELF.fetch(origin + '/api/admin' + path, { method, headers: { Authorization: 'Bearer local-test-token', 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
}
beforeEach(async () => {
  for (const sql of schema.split(';').filter(query => query.trim())) await bindings.DB.prepare(sql).run();
  await request('/categories', 'POST', { id: 'film', name: 'Film', display_order: 0 });
});
describe('Sax Music workflows in local Workers/D1/R2', () => {
  it('requires authentication before accepting admin requests', async () => {
    expect((await SELF.fetch(origin + '/api/admin/projects')).status).toBe(401);
    expect((await SELF.fetch(origin + '/api/admin/upload/direct', { method: 'POST', body: 'invalid multipart' })).status).toBe(401);
  });
  it('fails closed when the admin secret is missing', async () => {
    const response = await worker.fetch(new Request(origin + '/api/admin/projects', { headers: { Authorization: 'Bearer undefined' } }), { ...bindings, ADMIN_TOKEN: undefined as unknown as string });
    expect(response.status).toBe(401);
  });
  it('creates a draft, then publishes without losing the cover', async () => {
    const image = 'https://hls.saxmusic.site/img/project/cover.jpg';
    expect((await request('/projects', 'POST', { id: 'project', title: 'Soundtrack', category_id: 'film', image })).status).toBe(200);
    const draft = await (await request('/projects')).json() as Array<{ image: string; is_published: number }>;
    expect(draft[0]).toMatchObject({ image, is_published: 0 });
    await request('/projects/project', 'PUT', { is_published: true });
    const published = await (await request('/projects')).json() as Array<{ image: string; is_published: number }>;
    expect(published[0]).toMatchObject({ image, is_published: 1 });
    const portfolio = await (await SELF.fetch(origin + '/api/v1/portfolio')).json() as Array<{ items: Array<{ image: string }> }>;
    expect(portfolio[0].items[0].image).toBe(image);
  });
  it('imports audio and preserves HLS package filenames', async () => {
    const form = new FormData(); form.append('file', new File(['test-audio'], 'theme.mp3', { type: 'audio/mpeg' }));
    const audio = await SELF.fetch(origin + '/api/admin/upload/direct', { method: 'POST', headers: { Authorization: 'Bearer local-test-token' }, body: form });
    expect(audio.status).toBe(200);
    const data = await audio.json() as { key: string; url: string };
    expect(data.url).toContain('https://hls.saxmusic.site/uploads/');
    expect(await (await bindings.BUCKET.get(data.key))?.text()).toBe('test-audio');
    const packageForm = new FormData(); packageForm.append('file', new File(['segment'], 'segment001.ts')); packageForm.append('bundle', '12345678-1234-1234-1234-123456789abc'); packageForm.append('relativePath', 'theme/segment001.ts');
    const segment = await SELF.fetch(origin + '/api/admin/upload/direct', { method: 'POST', headers: { Authorization: 'Bearer local-test-token' }, body: packageForm });
    expect(segment.status).toBe(200);
    expect((await segment.json() as { key: string }).key).toBe('hls/12345678-1234-1234-1234-123456789abc/theme/segment001.ts');
  });
  it('rejects executable uploads and HLS path traversal', async () => {
    for (const [name, path] of [['bad.html', 'theme/bad.html'], ['segment.ts', '../segment.ts']]) {
      const form = new FormData(); form.append('file', new File(['test'], name)); form.append('bundle', '12345678-1234-1234-1234-123456789abc'); form.append('relativePath', path);
      expect((await SELF.fetch(origin + '/api/admin/upload/direct', { method: 'POST', headers: { Authorization: 'Bearer local-test-token' }, body: form })).status).toBe(400);
    }
  });
  it('reorders tracks without changing project metadata', async () => {
    await request('/projects', 'POST', { id: 'project', title: 'Soundtrack', category_id: 'film', image: 'https://hls.saxmusic.site/img/a.jpg' });
    for (const [index, title] of ['Opening', 'Finale'].entries()) await request('/tracks', 'POST', { title, src: 'https://hls.saxmusic.site/theme.mp3', project_id: 'project', display_order: index });
    const tracks = await (await request('/tracks/project')).json() as Array<{ id: number }>;
    await request('/tracks/reorder', 'PATCH', { items: [{ id: tracks[0].id, display_order: 1 }, { id: tracks[1].id, display_order: 0 }] });
    const reordered = await (await request('/tracks/project')).json() as Array<{ title: string }>;
    expect(reordered.map(track => track.title)).toEqual(['Finale', 'Opening']);
  });
  it('hides database errors from clients', async () => {
    const response = await request('/categories', 'POST', { id: 'film', name: 'Film', display_order: 0 });
    expect(response.status).toBe(500); expect(await response.text()).not.toMatch(/D1|SQL|UNIQUE|constraint|stack/i);
  });
});
