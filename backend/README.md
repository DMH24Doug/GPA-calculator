# Backend

This backend contains the GPA calculation rules and the MySQL-facing server API.

## Structure

- `src/config/env.js`: environment variable loading
- `src/config/database.js`: MySQL pool configuration
- `src/db/mysql.js`: database connection helpers
- `src/db/migrate.js`: migration runner
- `src/db/migrations/`: schema migration files
- `src/models/gradeModel.js`: grade mappings and exclusion rules
- `src/services/gpaService.js`: GPA calculation logic
- `src/controllers/gpaController.js`: request handling
- `src/controllers/subjectController.js`: subject import and retrieval
- `src/controllers/systemController.js`: health and DB test endpoints
- `src/routes/systemRoutes.js`: system endpoints
- `src/routes/gpaRoutes.js`: GPA endpoints
- `src/routes/subjectRoutes.js`: subject endpoints
- `src/app.js`: Express app setup
- `src/server.js`: server entry point

## Environment

Copy `.env.example` to `.env` and fill in your MySQL details.

When the backend starts, it will automatically run any pending migrations.
You can also run migrations manually with:

```bash
npm run migrate
```

To add a new schema change later, create a new file in `src/db/migrations/`
with the next prefix, for example:

- `002_add_updated_at_to_subjects.js`
- `003_create_users_table.js`

## API

`POST /api/gpa/calculate`

Example request body:

```json
{
  "subjects": [
    { "courseCode": "CS101", "grade": "A" },
    { "courseCode": "MA101", "grade": "B+" }
  ]
}
```

`GET /api/health`

Basic backend health check.

`GET /api/health/db`

Tests whether the backend can connect to MySQL using your `.env` settings.

`GET /api/subjects`

Loads saved subjects from MySQL.

`POST /api/subjects/import`

Imports scanned or manually prepared subjects into MySQL.
