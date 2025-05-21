# MLM Binary Tree API

A backend API built with NestJS + Prisma + PostgreSQL for a simple MLM system.

## Features
- Register member with upline
- Auto downline placement (binary tree max 2 children)
- Search members by name/email/phone
- Get tree structure
- Basic CRUD

## Tech Stack
- NestJS
- Prisma ORM
- PostgreSQL (Supabase)
- Docker-ready

## How to Run (Dev)
1. `npm install`
2. Copy `.env.example` to `.env` and set your DATABASE_URL
3. `npx prisma db push`
4. `npm run start:dev`

## Deploy
Deploy via Render with `start:prod` and `build` commands.