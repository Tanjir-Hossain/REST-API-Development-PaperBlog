# Blog Management API

A backend REST API for a multi-role blog platform, built with **Node.js, Express 5, Sequelize and MySQL**, secured with **JWT** authentication and **bcrypt** password hashing.

The API serves three kinds of callers:

| Role | Who they are | What they can do |
| --- | --- | --- |
| **Guest** | Not logged in | Read and search published blogs |
| **User** | A registered, active account | Everything a guest can, plus manage their own profile, password and blogs |
| **Admin** | A user whose `role` is `admin` | Everything a user can, plus manage all users and moderate any blog |

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Getting started](#getting-started)
3. [Environment variables](#environment-variables)
4. [How authentication works](#how-authentication-works)
5. [API reference](#api-reference)
6. [Request & response examples](#request--response-examples)
7. [Validation & status codes](#validation--status-codes)
8. [Project layout](#project-layout)
9. [Postman](#postman)

---

## Tech stack

- **Runtime:** Node.js (ES modules)
- **Framework:** Express 5
- **ORM / Database:** Sequelize 6 + MySQL (`mysql2` driver)
- **Auth:** JSON Web Tokens (`jsonwebtoken`)
- **Password hashing:** `bcryptjs`
- **Config / middleware:** `dotenv`, `cors`

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env          # Windows: copy .env.example .env
#    then edit .env with your MySQL credentials and a JWT secret

# 3. Create the database
#    Either run database/schema.sql in MySQL, or just start the app —
#    Sequelize creates the tables automatically on first boot.

# 4. Run
npm run dev     # development, auto-reload via nodemon
npm start       # production
```

The server starts on `http://localhost:5000` (or the `PORT` you set).

### Creating the first admin

An admin is simply a user with `role = 'admin'`. Register a normal account, then promote it directly in MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | HTTP port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `secret` |
| `DB_NAME` | Database name | `blogdb` |
| `JWT_SECRET` | Secret used to sign tokens | a long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |

`.env` and `node_modules/` are git-ignored and must never be committed.

---

## How authentication works

1. A user registers (`/api/auth/register`) — the password is hashed with bcrypt before it ever touches the database, and the role is forced to `user`.
2. On login (`/api/auth/login`) the credentials are checked and, for an **active** account, a signed JWT is returned in `data.token`.
3. Protected endpoints expect that token in the header:

   ```
   Authorization: Bearer <token>
   ```

4. The `authenticate` middleware verifies the token and attaches the user to the request; the `authorize("admin")` middleware guards admin-only routes.

Passwords are excluded from every query at the model layer, so they can never leak through an API response.

---

## API reference

Base path: `http://localhost:5000`

### Auth

| # | Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- | --- |
| 1 | POST | `/api/auth/register` | Public | Register a new user |
| 2 | POST | `/api/auth/login` | Public | Log in and receive a JWT |
| 3 | POST | `/api/auth/forgot-password` | Public | Start a password reset (issues a one-time token) |
| 4 | PATCH | `/api/auth/reset-password/:token` | Public | Set a new password using a reset token |

### Users

| # | Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- | --- |
| 5 | GET | `/api/users` | Admin | List all users |
| 6 | GET | `/api/users/:id` | Admin | Get a single user |
| 7 | PATCH | `/api/users/:id/status` | Admin | Activate / deactivate a user |
| 8 | GET | `/api/users/profile` | User / Admin | Get own profile |
| 9 | PUT | `/api/users/profile/update` | User / Admin | Update own first/last name |
| 10 | PATCH | `/api/users/profile/image` | User / Admin | Upload own avatar (`multipart/form-data`, field `image`) |
| 11 | PATCH | `/api/users/password` | User / Admin | Change own password |

**Password reset (no email provider):** `forgot-password` stores only a SHA-256 hash of a random token with a 15-minute expiry and always replies with the same generic message. Outside production (`NODE_ENV !== "production"`) the response also returns `resetToken` / `resetUrl` so the flow is testable locally.

**Avatar upload:** accepts a single `image` field (JPG / PNG / WEBP, ≤ 2 MB) via `multipart/form-data`. Files are stored under `/uploads/profile` and served statically from `/uploads`; the stored path is saved on the user as `profileImage`.

### Blogs

| # | Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- | --- |
| 12 | POST | `/api/blogs/create` | User / Admin | Create a blog |
| 13 | GET | `/api/blogs` | Public | List / search / filter blogs |
| 14 | GET | `/api/blogs/:id` | Public | Get a single blog |
| 15 | PUT | `/api/blogs/update/:id` | Owner / Admin | Update a blog |
| 16 | DELETE | `/api/blogs/delete/:id` | Owner / Admin | Delete a blog |

**Search & filter** (all public, combinable):

```
GET /api/blogs?title=playwright
GET /api/blogs?category=Testing
GET /api/blogs?title=playwright&category=Testing
```

`title` does a partial, case-insensitive match on the blog title; `category` is an exact match.

---

## Request & response examples

Every response follows the same envelope:

```json
{ "success": true, "message": "…", "data": { } }
```

**Register** → `201 Created`

```json
// POST /api/auth/register
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login** → `200 OK`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "firstname": "John", "lastname": "Doe", "email": "john@example.com", "role": "user", "isActive": true }
  }
}
```

**Public blog list** → `200 OK` (author info is limited to safe fields)

```json
{
  "success": true,
  "message": "Blogs retrieved.",
  "data": [
    {
      "id": 1,
      "blogTitle": "Introduction to API Testing",
      "blog": "This article explains...",
      "category": "Testing",
      "author": { "id": 5, "firstname": "John", "lastname": "Doe" }
    }
  ]
}
```

---

## Validation & status codes

| Code | When |
| --- | --- |
| `200 OK` | Successful read / update / delete |
| `201 Created` | Successful registration or blog creation |
| `400 Bad Request` | Missing/invalid fields, bad email, short password, invalid id |
| `401 Unauthorized` | Missing or invalid token / wrong credentials |
| `403 Forbidden` | Deactivated account, or acting outside your role/ownership |
| `404 Not Found` | User or blog does not exist |
| `409 Conflict` | Email already registered |
| `500 Internal Server Error` | Unexpected failure |

Rules enforced:

- Required fields cannot be empty; email must be well-formed and unique.
- Passwords must be at least 6 characters and are always hashed before storage.
- A client can never set its own `role` or `isActive` (not at registration, not on profile update).
- A blog's `userId` always comes from the token, never from the request body.
- Normal users can only modify their own blogs; admins can modify any.

---

## Project layout

```
blog-management-api/
├── config/
│   └── database.js          # Sequelize connection
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   └── blog.controller.js
├── middlewares/
│   ├── authenticate.js      # verifies the JWT
│   ├── authorize.js         # role guard
│   └── errorHandler.js      # 404 + central error formatter
├── models/
│   ├── user.model.js
│   ├── blog.model.js
│   └── index.js             # associations
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   └── blog.routes.js
├── services/
│   └── auth.service.js      # register / login business logic
├── utils/
│   ├── ApiError.js
│   ├── asyncHandler.js
│   ├── response.js
│   └── token.js
├── validators/
│   └── index.js
├── database/
│   └── schema.sql
├── app.js                   # express app + route mounting
├── server.js                # boot + DB connection
├── .env.example
└── package.json
```

---

## Postman

- Collection: [`Blog Management API.postman_collection.json`](Blog%20Management%20API.postman_collection.json)
- Environment: [`Blog Management API.postman_environment.json`](Blog%20Management%20API.postman_environment.json)
- Published documentation: **{{POSTMAN_DOC_LINK}}**

Import both JSON files, select the environment, and make sure `baseUrl` points to your server. The login requests include a small test script that automatically stores the returned token into `userToken` / `adminToken`, so the protected requests work without copy-pasting tokens.
