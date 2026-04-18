# Orbit - HR Management System with RBAC

A comprehensive HR management system with Role-Based Access Control (RBAC) built with modern frameworks to manage documents, track employee forms, and administer system users. Recently migrated to **NestJS** for an optimized backend architecture.

## Features

- **JWT Authentication**: Secure token-based authentication mechanism.
- **Role-Based Access Control (RBAC)**: Flexible user permissions system utilizing NestJS decorators and guards.
- **Document Manager**: Upload, view, and organize employee action forms (PDFs) directly from the application.
- **Document Archives**: Maintain logs of old documents and organize via robust dashboard filters.
- **Admin Dashboard**: Complete user profile and system role management interface.
- **Modern UI**: Polished front-end dynamic forms with localization backing (English/Arabic).
- **RESTful API**: Completely scalable modular backend framework architecture. 

## Tech Stack

### Core
- **Backend**: NestJS, Node.js, Fastify
- **Language**: TypeScript (Backend), JavaScript (Frontend)
- **Database**: MongoDB utilizing Mongoose ODM 
- **Storage**: Real-time File Streaming via Fastify Static Plugins

### Specific Libraries
- **Security**: `@nestjs/passport`, `passport-jwt`, `bcryptjs`
- **Validation**: `class-validator`, `class-transformer`
- **File Management**: Node streams via `@fastify/multipart`

## Project Structure

```
├── public/                 # Client Frontend 
│   ├── css/                # Static stylesheets
│   ├── html/               # UI HTML Pages
│   └── js/                 # Application logical behavior
├── src/                    # Backend Source Files
│   ├── admin/              # User/Role administration modules
│   ├── auth/               # Passport authentication wrappers
│   ├── database/           # Connection initialization
│   ├── forms/              # PDF ingestion and DB logging modules
│   ├── schemas/            # Database schema definitions
│   ├── app.module.ts       # Core Nest application container
│   └── main.ts             # Server entrypoint
├── uploads/                # Dynamic form upload storage
├── .env                    # System variables
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hr-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Runtime Configuration**
   - Provide a functional `.env` derived from your preferred variables:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/hr-system
   JWT_SECRET=your-super-secret-jwt-key
   MAX_FILE_SIZE=10485760
   ```

4. **Seed the database**
   *(Note: Utilize if needing defaults)*
   ```bash
   npm run seed
   ```

5. **Start the NestJS Development environment**
   ```bash
   npm run start:dev
   ```

The server will automatically map endpoints to `http://localhost:3000`.

## Default Admin Account

If using a fresh seeded database, you can login with:
- **Username**: admin
- **Email**: admin@example.com (or try username string directly with 'admin')
- **Password**: admin123

## Selected NestJS Endpoints

*(Please refer to specific modules in `src/` for exhaustive mappings)*

### Forms Retrieval
`GET /api/forms` - Retrieves forms associated dynamically to RBAC.  
`POST /api/forms` - Captures file streams parsed via Fastify Multipart attached via `.pdf`  
`PATCH /api/forms/:id/status` - Manages form activity state modifications  

### Form Archive
`GET /api/forms/archived` - Pulls inactive forms from DB 

### Admin Management
`GET /api/admin/users` - Yields registry data  
`POST /api/admin/users` - Constructs profiles bound to configured roles

## Development Workflow

### Adding New API Modules
With NestJS, rely purely on the CLI or follow standard mapping strategies:
1. `nest generate module module-name`
2. Apply `@Module()` attributes
3. Develop dedicated Service/Controller schemas

### Security Constraints
All HTTP inbound traffic is explicitly cross-referenced behind `@UseGuards(RolesGuard)` ensuring payload execution is authenticated safely. 
```typescript
@RequirePermission('forms_create')
@Post()
```
*Applies granular restrictions explicitly tied to JWT definitions.*

## License

This project is licensed under the MIT License.
