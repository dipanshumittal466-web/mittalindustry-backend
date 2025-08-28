# Mittal Industry - Backend

This is the **Backend (Node.js + Prisma + Python scripts)** for Mittal Industry with Blog CMS.

## Setup
```bash
npm install
npm run dev    # or node index.js
```

## Prisma
```bash
npx prisma migrate dev
npx prisma generate
```

## Environment
Create `.env` in backend with:
```
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
```
