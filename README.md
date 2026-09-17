# Event Hub - Concert Management System

A full-stack concert/event management application built with Node.js/Express backend, React/Vite frontend, PostgreSQL, Prisma ORM, and Docker.

# Screenshots

<img width="2048" height="1150" alt="e" src="https://github.com/user-attachments/assets/01538b90-26d1-457a-a68f-fb60b8645ce8" />
<img width="2048" height="1165" alt="m" src="https://github.com/user-attachments/assets/fa1bd62a-fd7b-4a82-ac4e-83b94e62cede" />
<img width="2048" height="1148" alt="j" src="https://github.com/user-attachments/assets/6a4461eb-9cb7-4dda-a420-aa9b0598be58" />
<img width="981" height="452" alt="t" src="https://github.com/user-attachments/assets/9dbb642d-87c5-4a61-b12b-dfc06c3860c2" />

## Database Architecture (ERD)

```mermaid
erDiagram
    USER {
        String id PK
        String email UK
        String fullName
        UserRole role
        Boolean isActive
        DateTime createdAt
    }
    EVENT {
        String id PK
        String title
        String slug UK
        DateTime startDate
        DateTime endDate
        Int capacity
        EventStatus status
        Float price
    }
    EVENT_ROLE {
        String id PK
        EventRoleType role
        DateTime assignedAt
    }
    CATEGORY {
        String id PK
        String name UK
        String slug UK
    }
    EVENT_REGISTRATION {
        String id PK
        String status
        DateTime registeredAt
    }
    TICKET_TYPE {
        String id PK
        String name
        Decimal price
        Int totalCount
        TicketCategory category
    }
    TICKET {
        String id PK
        Boolean isSold
        Boolean isUsed
        DateTime soldDate
    }
    ORDER {
        String id PK
        Decimal totalAmount
        OrderStatus status
        DateTime createdAt
    }
    ORDER_ITEM {
        String id PK
        Int quantity
        Decimal unitPrice
        Decimal totalPrice
    }
    OUTBOX_EVENT {
        String id PK
        String type
        String status
        Json payload
    }

    %% Core Event Management Relations
    USER ||--o{ EVENT : "organizes"
    CATEGORY ||--o{ EVENT : "categorizes"
    
    %% Role & Access Management Relations
    USER ||--o{ EVENT_ROLE : "acts_as"
    USER ||--o{ EVENT_ROLE : "assigned_by"
    EVENT ||--o{ EVENT_ROLE : "includes"
    
    %% Registration Relations
    USER ||--o{ EVENT_REGISTRATION : "registers"
    EVENT ||--o{ EVENT_REGISTRATION : "has_registrations"
    
    %% Ticket Inventory & Order Relations
    EVENT ||--o{ TICKET_TYPE : "provides"
    EVENT ||--o{ ORDER : "receives"
    USER ||--o{ ORDER : "places"
    ORDER ||--o{ ORDER_ITEM : "contains"
    TICKET_TYPE ||--o{ ORDER_ITEM : "defines_pricing"
    
    %% Actual Ticket Generation Relations
    USER ||--o{ TICKET : "owns"
    TICKET_TYPE ||--o{ ORDER_ITEM : "defines_pricing"
    ORDER_ITEM ||--o{ TICKET : "generates_physical_ticket"
```

## Features

- Event creation and management
- Category organization for events
- User authentication with JWT
- Payment processing with Stripe
- Interactive API documentation with Swagger
- Modern React frontend with Vite
- PostgreSQL database with Prisma ORM
- Dockerized development and production environments

## Project Structure

```
concert-manager/
├── docker-compose.yml          # Default development compose file
├── docker-compose.dev.yml      # Development compose file
├── docker-compose.prod.yml     # Production compose file
├── Makefile                    # Common Docker, Prisma, and log commands
├── .env                        # Root environment variables used by Compose
├── README.md
│
├── backend/
│   ├── Dockerfile              # Default backend Dockerfile
│   ├── Dockerfile.dev          # Development backend image
│   ├── Dockerfile.prod         # Production backend image
│   ├── prisma.config.ts        # Prisma configuration
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── src/
│   ├── package.json
│   ├── server.js
│   ├── .env                    # Backend runtime environment variables
│   └── .dockerignore
│
└── frontend/
    ├── Dockerfile              # Default frontend Dockerfile
    ├── Dockerfile.dev          # Development frontend image
    ├── Dockerfile.prod         # Production frontend image
    ├── src/
    ├── public/
    ├── package.json
    ├── vite.config.js
    ├── nginx.conf
    ├── .env.development        # Frontend development environment variables
    └── .dockerignore
```

## Environment Separation

The project has separate Docker and Compose configurations for development and production.

| Environment | Compose File | Frontend Dockerfile | Backend Dockerfile | Purpose |
|-------------|--------------|---------------------|--------------------|---------|
| Development | `docker-compose.dev.yml` | `frontend/Dockerfile.dev` | `backend/Dockerfile.dev` | Hot reload, mounted source code, local debugging |
| Production | `docker-compose.prod.yml` | `frontend/Dockerfile.prod` | `backend/Dockerfile.prod` | Optimized static build, Nginx, no source mounts |

`docker-compose.yml` points to the development setup by default.

## Makefile Commands

The `Makefile` is the recommended way to manage the project.

### Start and stop

```bash
make up
make dev-up
make dev-down
```

Production:

```bash
make prod
make prod-up
make prod-down
```

Restart:

```bash
make restart
make prod-restart
```

Clean local containers, networks, volumes, and Docker builder cache:

```bash
make clean
```

### Prisma and database

Create and apply a development migration:

```bash
make migrate-dev
```

Apply production migrations manually:

```bash
make migrate-prod
```

Seed the database:

```bash
make seed
```

Open the PostgreSQL shell:

```bash
make db-shell
```

### Logs and shell access

```bash
make logs-be
make logs-fe
make logs
make sh-be
make sh-fe
make ps
```

## Development Setup

Start the development environment:

```bash
make dev-up
```

If this is the first run, or if the Prisma schema changed, run:

```bash
make migrate-dev
make seed
```

Development services:

| Service | Address |
|---------|---------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| PostgreSQL | `localhost:5433` |
| Swagger | http://localhost:3000/api-docs |

The development setup mounts `./backend` and `./frontend` into their containers, so source code changes are reflected without rebuilding the image.

## Production Setup

The production setup builds optimized images:

- Backend runs Prisma migrations and seed automatically before starting the API.
- Frontend is built with Vite and served through Nginx.
- PostgreSQL data is stored in the `postgres_data` Docker volume.
- The database port is not exposed to the host in production compose.

Before building production, set frontend public environment variables in your shell or root `.env` file:

```bash
VITE_API_URL=https://api.your-domain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key_here
```

Start production:

```bash
make prod-up
```

Production services:

| Service | Address |
|---------|---------|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| PostgreSQL | Docker volume only, not exposed to host |

To force a clean production rebuild:

```bash
make prod-restart
```

## Manual Docker Compose Commands

Development:

```bash
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
```

Production:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
docker-compose -f docker-compose.prod.yml down
```

## API Documentation

Once the backend is running, visit:

```text
http://localhost:3000/api-docs
```

## Environment Variables

### Root `.env`

Used by Docker Compose for shared values.

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `admin` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `concert_db` |
| `VITE_API_URL` | Public API URL used during frontend production build | `https://api.your-domain.com` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key used by frontend production build | `pk_test_...` |

### Backend `.env`

Used by the backend container.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string inside Docker network | `postgresql://admin:postgres@postgres:5432/concert_db?schema=public` |
| `PORT` | Backend port | `3000` |
| `JWT_SECRET` | Secret for JWT token signing | `your_secret_here` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `EMAIL_USER` | SMTP username | `your_email@example.com` |
| `EMAIL_PASS` | SMTP password or app password | `your_password_here` |

Do not commit real production secrets to the repository.

### Frontend `.env.development`

Used by the development frontend container.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |

## Database Schema

The application uses Prisma ORM. Main domain models include:

- User
- Category
- Event
- EventRole
- EventRegistration
- TicketType
- Ticket
- Order
- OrderItem
- OutboxEvent

Run Prisma Studio through the backend container when needed:

```bash
docker exec -it concert_backend npx prisma studio
```

## Deployment Notes

For production, prefer the production compose file:

```bash
make prod-up
```

The production backend command runs:

```bash
npx prisma migrate deploy && npx prisma db seed && npm start
```

This means migrations and seed data are applied automatically when the backend container starts.

For frontend production builds, make sure `VITE_API_URL` points to the real API address before building. If the API URL changes, rebuild the frontend image.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Node.js, Express, React, and Vite
- Database powered by PostgreSQL and Prisma ORM
- Payments processed securely with Stripe
- API documentation generated with Swagger/OpenAPI
- Containerized with Docker Compose
