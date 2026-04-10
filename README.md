# Mabruk Oil Operations - HR System with RBAC

A comprehensive HR management system with Role-Based Access Control (RBAC) built with Node.js, Express, and MongoDB.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Flexible permissions system
- **File Management**: Upload and manage employee action forms (PDFs)
- **Admin Dashboard**: Complete user and role management
- **RESTful API**: Well-structured API endpoints

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: multer

## Project Structure

```
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── adminController.js   # Admin operations
│   └── formsController.js   # Forms management
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── authorize.js        # Permission authorization middleware
├── models/
│   ├── User.js             # User schema
│   ├── Role.js             # Role schema
│   ├── Permission.js       # Permission schema
│   └── Form.js             # Form schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── admin.js            # Admin routes
│   └── forms.js            # Forms routes
├── uploads/                # File uploads directory
├── .env                    # Environment variables
├── package.json
├── seed.js                 # Database seeder
└── server.js               # Main application file
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

3. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env` file

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## Default Admin Account

After seeding, you can login with:
- **Email**: admin@example.com
- **Password**: admin123

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "roleId": "60d5ecb74b24c72b8c8b4567"  // Optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Admin Endpoints (Admin Only)

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "roleId": "60d5ecb74b24c72b8c8b4567"
}
```

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>
```

#### Assign Role to User
```http
PUT /api/admin/users/:userId/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "60d5ecb74b24c72b8c8b4567"
}
```

#### Create Role
```http
POST /api/admin/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "MANAGER",
  "description": "Department Manager",
  "permissions": ["60d5ecb74b24c72b8c8b4567", "60d5ecb74b24c72b8c8b4568"]
}
```

#### Get All Roles
```http
GET /api/admin/roles
Authorization: Bearer <token>
```

#### Create Permission
```http
POST /api/admin/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "reports_view",
  "description": "View reports",
  "resource": "reports",
  "action": "read"
}
```

### Forms Endpoints

#### Get All Forms
```http
GET /api/forms
Authorization: Bearer <token>
```

#### Upload Form
```http
POST /api/forms
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- employeeId: "EMP-001"
- employeeName: "John Doe"
- actionCode: "ACT-2024-001"  // Optional
- actionDate: "2024-01-15"
- department: "Operations"
- pdfFile: <PDF file>
```

#### Search Forms
```http
GET /api/forms/search?q=searchterm
Authorization: Bearer <token>
```

#### Delete Form
```http
DELETE /api/forms/:id
Authorization: Bearer <token>
```

## Permission System

### Available Permissions

| Permission | Description | Resource | Action |
|------------|-------------|----------|--------|
| forms_create | Create new forms | forms | create |
| forms_read | View forms | forms | read |
| forms_update | Update forms | forms | update |
| forms_delete | Delete forms | forms | delete |
| users_manage | Manage users | users | manage |
| roles_manage | Manage roles | roles | manage |
| permissions_manage | Manage permissions | permissions | manage |

### Default Roles

1. **ADMIN**: Full access to all features
2. **USER**: Can create, read, and update forms

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 24-hour expiration
- **Input Validation**: express-validator for all inputs
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Comprehensive error responses
- **File Upload Security**: Type and size restrictions

## Development

### Adding New Permissions

1. Create permission in database or via API
2. Update role permissions
3. Use `authorize('permission_name')` middleware in routes

### Environment Variables

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hr-system
JWT_SECRET=your-super-secret-jwt-key
MAX_FILE_SIZE=10485760
```

## License

This project is licensed under the MIT License.