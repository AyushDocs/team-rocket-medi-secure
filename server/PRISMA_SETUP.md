Prisma + SQLite setup

1. Install dependencies (from `server` folder):

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Create and apply migrations (creates local SQLite DB):

```bash
npx prisma migrate dev --name init
```

4. (Optional) Open Prisma Studio to inspect data:

```bash
npm run prisma:studio
```

Notes:
- Copy `.env.example` to `.env` and set `DB_FILE_PATH_SECRET` or `DATABASE_URL` as appropriate.
- The server code will set `DATABASE_URL` from `DB_FILE_PATH_SECRET` at runtime if `DATABASE_URL` is not present.
