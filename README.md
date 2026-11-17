# web2-exam — Country → Region → Location API

NestJS + TypeORM + PostgreSQL backend with three CRUD modules and two one-to-many relations.
The conceptual Country → Region → Location variant is implemented so the required nested
lookup endpoints match the assignment examples.

## Stack

- NestJS 11, TypeScript
- TypeORM 0.3 + PostgreSQL 16
- DTO validation with `class-validator` / `class-transformer`
- Swagger UI at `/api/docs`
- Docker + Docker Compose
- Jest + Supertest + pg-mem for end-to-end tests

## Data model

```mermaid
erDiagram
    countries ||--o{ regions : "1 : N"
    regions ||--o{ locations : "1 : N"
    countries { int id PK; varchar name; varchar code UK }
    regions { int id PK; varchar name; varchar code; int countryId FK }
    locations { int id PK; varchar name; varchar type; int population; int regionId FK }
```

- `regions.countryId` → `countries.id`, `ON DELETE CASCADE`.
- `locations.regionId` → `regions.id`, `ON DELETE CASCADE`.
- Region code is unique inside its country. Country code is globally unique.

## Run with Docker

```bash
cp .env.example .env
# Set a local DB_PASS in .env before the first start
docker compose up --build -d
docker compose exec app node dist/database/seed.js
```

- API: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/api/docs>
- Health check: <http://localhost:3000/health>

`docker-compose.yml` starts PostgreSQL and the API, waits for the database health check, and
loads configuration from `.env`. The `.env` file is ignored by Git; only `.env.example` is
committed.

## Run locally

```bash
npm install
docker compose up -d db
```

`.env` contains `DB_HOST=db` for Compose. For a locally started API, override the host:

```bash
# Bash
DB_HOST=localhost npm run start:dev

# PowerShell
$env:DB_HOST='localhost'; npm run start:dev
```

Alternatively create `.env.local` with `DB_HOST=localhost`; it takes precedence over `.env`.
Seed after the application/database schema is ready:

```bash
DB_HOST=localhost npm run seed
```

## API

Base URL: `http://localhost:3000`.

| Operation | Endpoint |
| --- | --- |
| Create country / region / location | `POST /countries`, `POST /regions`, `POST /locations` |
| List all | `GET /countries`, `GET /regions`, `GET /locations` |
| Get by id | `GET /countries/:id`, `GET /regions/:id`, `GET /locations/:id` |
| Update | `PUT /countries/:id`, `PUT /regions/:id`, `PUT /locations/:id` |
| Delete | `DELETE /countries/:id`, `DELETE /regions/:id`, `DELETE /locations/:id` |
| Regions of a country | `GET /countries/:id/regions` |
| Locations of a region | `GET /regions/:id/locations` |
| Locations of a country (join) | `GET /countries/:id/locations` |

Successful deletes return `204 No Content`. Validation errors return `400`, missing parents or
resources return `404`, and duplicate codes return `409`.

### Example requests

```bash
# Country
curl -X POST http://localhost:3000/countries \
  -H "Content-Type: application/json" \
  -d '{"name":"Moldova","code":"MD"}'

# Region (countryId = 1)
curl -X POST http://localhost:3000/regions \
  -H "Content-Type: application/json" \
  -d '{"name":"Centre","code":"CE","countryId":1}'

# Location (regionId = 1)
curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -d '{"name":"Chișinău","type":"city","population":639000,"regionId":1}'

# Nested lookups
curl http://localhost:3000/countries/1/regions
curl http://localhost:3000/regions/1/locations
curl http://localhost:3000/countries/1/locations
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST` | `localhost` | PostgreSQL host (`db` in Compose) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `appuser` | Database user |
| `DB_PASS` | required | Local database password, set in `.env` |
| `DB_NAME` | `appdb` | Database name |
| `PORT` | `3000` | API HTTP port |
| `DB_SYNCHRONIZE` | `true` | TypeORM schema auto-sync (demo setting) |
| `DB_LOGGING` | `false` | Log SQL queries |
| `DB_SSL` | `false` | Enable SSL for a managed database |

`synchronize: true` is convenient for the exam/demo. In production, disable it and use
TypeORM migrations.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Development server with watch mode |
| `npm run build` | Production build to `dist/` |
| `npm run start:prod` | Run the compiled application |
| `npm run seed` | Idempotent demo data |
| `npm run lint` | ESLint checks |
| `npm run format` | Prettier formatting |
| `npm run test:e2e` | End-to-end CRUD tests against in-memory PostgreSQL |

## Project structure

```text
src/
  countries/       entity, DTOs, service, controller, module
  regions/         entity, DTOs, service, controller, module
  locations/       entity, DTOs, service, controller, module
  config/          TypeORM configuration
  database/        seed script
  app.module.ts
  main.ts          validation pipe + Swagger bootstrap
test/
  app.e2e-spec.ts  full CRUD, nested routes, validation, cascade checks
```

## Swagger decorators used

`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiParam`, and `@ApiProperty` on
entities and DTOs. OpenAPI JSON is served at `/api/docs-json`.
