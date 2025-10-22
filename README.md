# Cowrite Document Service

Cowrite Document Service is a small NestJS-based backend for storing user documents (notes) in an S3-compatible object storage. It provides APIs to create notes, list notes, and retrieve note contents. Notes are stored in S3 while metadata (name, s3Key, size, owner) is kept in a relational database via TypeORM.

## Features

- Create a markdown note for an authenticated user
- Store note content in S3-compatible storage
- Keep note metadata in a relational database (TypeORM)
- Simple session-based authentication flow (via cookie)

## Getting started

Prerequisites:

- Node.js 18+ (or the version specified in project)
- npm or yarn
- An S3-compatible storage (AWS S3, MinIO, or local emulator)
- A relational database supported by TypeORM (SQLite, Postgres, MySQL)

Install dependencies:

```powershell
npm install
```

Environment variables

The service reads configuration from environment variables. Create a `.env` file in the root directory with the following variables:

**Database Configuration:**
- `DB_HOST` - Database host (e.g., localhost)
- `DB_PORT` - Database port (e.g., 5432 for PostgreSQL)
- `DB_USERNAME` - Database username (e.g., admin)
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name (e.g., cowrite_document_db)

**S3 Configuration:**
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ENDPOINT` - Optional custom S3 endpoint (for MinIO/localstack)
- `AWS_ACCESS_KEY_ID` - S3 access key (default: test)
- `AWS_SECRET_ACCESS_KEY` - S3 secret key (default: test)
- `AWS_S3_BUCKET` - S3 bucket name (default: my-notes-bucket)

**Auth Service:**
- `AUTH_SERVICE_URL` - URL to the authentication service (e.g., http://localhost:8080)

**Server Configuration:**
- `PORT` - HTTP port (default: 3000)

Example `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=password
DB_DATABASE=cowrite_document_db

# S3 Storage
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=my-notes-bucket

# Jwt
JWT_SECRET=secret
JWT_COOKIE_NAME=COWRITE_SESSION_ID

# Auth Service
AUTH_SERVICE_URL=http://localhost:8080

# Server
PORT=3000
```

Run the app:

```powershell
npm run start:dev
```

Run tests:

```powershell
npm test
```

Run linter and autofix:

```powershell
npm run lint:fix
```

## Project structure

- `src/` - source code
  - `note/` - note controller/service/entity
  - `s3/` - S3 client wrapper service
  - `auth/` - basic auth service and DTOs
  - `main.ts` - app bootstrap

## Notes

- Tests use Jest and include unit tests for services. Some tests rely on mocked S3 and Auth services.
- This project is intended as a small backend example; adapt for production (error handling, security, input validation) before use.
