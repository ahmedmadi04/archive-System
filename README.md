# Orbit - Learning RBAC & Authentication (Express.js)

Orbit is a specialized HR Management System designed to demonstrate the implementation of **Role-Based Access Control (RBAC)** and **JWT Authentication** in a modern Node.js/Express application. This project serves as a practical guide for developers looking to understand how to secure APIs and manage granular user permissions.

## 🎓 Core Learning Objectives

### 1. Authentication (JWT Flow)
Learn how to implement a secure, stateless authentication system using JSON Web Tokens.
- **Token Generation**: How to create signed tokens upon successful login using `jsonwebtoken`.
- **Token Verification**: Implementing middleware to validate tokens on every protected request.
- **Secure Password Handling**: Using `bcryptjs` for salt-based password hashing.

### 2. Role-Based Access Control (RBAC)
Understand how to restrict access to specific parts of your application based on user roles and permissions.
- **Admin vs. User**: How to differentiate between different levels of system access.
- **Granular Permissions**: Mapping specific actions (e.g., `forms_create`, `users_manage`) to roles in MongoDB.
- **Access Control Middleware**: Implementing reusable Express middleware to verify permissions before executing route logic.

## 🛠 Tech Stack

- **Backend**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose
- **Auth**: `jsonwebtoken`, `bcryptjs`
- **File Handling**: `multer`

## 📂 Project Structure (The "Engine" Room)

```
├── public/                 # HTML/JS Frontend
├── src/
│   ├── auth/              # Logic for login and profile
│   ├── middleware/        # The Security Guard:
│   │   ├── auth.middleware.js   # Validates the JWT Token
│   │   └── role.middleware.js   # Validates User Permissions
│   ├── routes/            # API Route definitions
│   ├── schemas/           # Mongoose Models (User, Role, Permission)
│   ├── app.js             # Main Express configuration
│   └── server.js          # Entry point (DB connection & Server logic)
├── scripts/
│   └── seed.js            # Initializing roles and the Admin account
├── uploads/                # Where PDF files are stored
└── .env                    # Secret environment variables
```

## 🚀 How it Works (Practical Guide)

### Part A: Authentication Middleware
Every time a user wants to access a "Protected" area, they must provide a token. The system checks this token in `src/middleware/auth.middleware.js`:
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded.userId).populate('role');
req.user = user; // Pass user data to the next function
```

### Part B: Permission Management
Permissions are handled in `src/middleware/role.middleware.js`. You can wrap any route like this:
```javascript
// Only users with 'forms_create' permission (or ADMIN) can post
router.post('/', authMiddleware, requirePermission('forms_create'), (req, res) => { ... });
```

## 🏗️ Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   Ensure your MongoDB is running and your `.env` has the correct `MONGODB_URI`.

3. **Initialize RBAC Data (Crucial)**
   The system starts empty. You **must** run the seed script to create the 'ADMIN' role and the first account:
   ```bash
   npm run seed
   ```

4. **Run the App**
   ```bash
   npm run start:dev
   ```

The server will start at `http://localhost:3000`.

## 🔑 Default Credentials

After seeding, you can log in to explore the Admin interface:
- **Username**: `admin`
- **Password**: `admin123`

## 🎯 Key Learning Exercises
- **Add a new Role**: Try modifying `seed.js` to add a "MODERATOR" role with limited permissions.
- **Test the Guard**: Try calling the `/api/admin/users` endpoint using a "USER" role token and see it fail with a `403 Forbidden`.
- **Expand the Logic**: Add a "can_edit_own_profile" permission that only allows users to modify their own data.

## License

This project is open-source and intended for educational purposes.
