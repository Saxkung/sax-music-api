# Sax Music API

Cloudflare Worker: `sax-music-api` at https://api.saxmusic.work. Public portfolio: `/api/v1/portfolio`. The existing D1 database `sax-music-db` and R2 bucket `sax-music` retain their production data. Media origin: https://hls.saxmusic.work.

Elysia 1.4 handles requests with `app.handle`. All `/api/admin/*` operations require the existing `ADMIN_TOKEN` Worker secret, before request-body parsing. Admin responses are never cached. CORS is restricted to the Sax Music frontend/admin and local development origins. Errors expose generic messages rather than SQL or stack details.

`POST /api/admin/upload/direct` accepts authenticated multipart uploads: cover images up to 5 MB and supported audio/HLS files up to 50 MB each. Files stream to R2. HLS imports preserve checked relative paths in a unique bundle; standalone uploads use unique object keys and immutable caching. The obsolete signing endpoint returns 410. Project drafts can be created without a cover; publishing requires a cover. Publishing and reordering preserve the existing cover unless a replacement is supplied. Previous cover objects are retained so failed saves cannot remove working media.

```sh
npm ci
npm run typecheck
npm test
npm run deploy
```

Tests use the current `@cloudflare/vitest-plugin` with the compatible Vitest 4.1 line, local D1 and local R2. Never apply the destructive test schema to production. `wrangler.jsonc` preserves existing Worker variables on deployment; it contains no authentication secret. Local development can supply `ADMIN_TOKEN` through `.env.local` or `.dev.vars`, both ignored by Git.

`data.sql` is the historical bootstrap snapshot, not a production migration. Do not import it into an existing deployed database.
