# BlogVerse

BlogVerse is a full-stack blogging platform built with **Next.js, TypeScript, and MongoDB**. It provides a public blog showcase along with separate authentication and management flows for regular users and administrators.

The project started as a frontend blog landing page and was extended into a functional full-stack application with authentication, persistent database storage, blog management, and role-based access control.

## Features

### Public Visitors

* Browse published blog posts without logging in
* Read full blog articles
* Search and filter blogs by category
* Responsive modern UI
* Dark mode support

### User

* Register a new account
* Sign in and log out
* Persistent authentication using secure cookies
* Create and publish blog posts
* View only their own blogs while logged in
* Delete their own blog posts
* Manage their profile
* User accounts cannot access the Admin login flow

### Admin

* Separate Admin login flow
* Role-based Admin authentication
* View and manage all blog posts
* Delete any blog post
* View registered users
* Delete users
* Delete a user's associated posts when removing the user
* Normal users cannot access Admin functionality

## Tech Stack

* **Frontend:** Next.js, React, TypeScript
* **Backend:** Next.js App Router / API Routes
* **Database:** MongoDB
* **Authentication:** JWT-based authentication with HTTP-only cookies
* **Password Security:** bcrypt password hashing
* **Styling:** CSS / responsive custom UI

## Getting Started

Follow these steps to run BlogVerse locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Jay-Prajapati-IT/blogverse.git
```

Move into the project directory:

```bash
cd blogverse
```

### 2. Install Dependencies

Make sure **Node.js** and **npm** are installed.

Then run:

```bash
npm install
```

### 3. Configure Environment Variables

The `.env.local` file is intentionally **not included in the GitHub repository** because it contains private credentials and secrets.

You must manually create a file named:

```text
.env.local
```

Create it in the **root directory** of the project, at the same level as `package.json`.

Example project structure:

```text
blogverse/
├── src/
├── public/
├── package.json
├── package-lock.json
├── .gitignore
└── .env.local
```

Add the required environment variables to `.env.local`.

Example:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority

JWT_SECRET=your_long_random_secret_key_here
```

Replace the example values with your own credentials.

#### `MONGODB_URI`

Create a MongoDB database/cluster and copy your MongoDB connection string.

Your connection string will look similar to:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

Replace the username, password, and cluster information with your actual MongoDB credentials.

> If your MongoDB password contains special characters, make sure they are properly URL-encoded in the connection string.

#### `JWT_SECRET`

Add a long, random secret used for authentication tokens.

Example:

```env
JWT_SECRET=replace_this_with_a_long_random_secret
```

Do not use the example secret in a real deployment.

> **Important:** Never commit `.env.local` to GitHub. It contains sensitive credentials.

Make sure `.gitignore` contains:

```gitignore
.env*
!.env.example
```

### 4. Configure MongoDB Access

If you are using MongoDB Atlas:

1. Create a MongoDB cluster.
2. Create a database user with a username and password.
3. Configure **Network Access** so your machine can connect.
4. Copy the connection string.
5. Add it as `MONGODB_URI` inside `.env.local`.

The application will create/use the required collections as data is added.

### 5. Run the Development Server

Start the application:

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:3000
```

The BlogVerse application should now be running locally.

## Authentication Flow

BlogVerse separates normal users and administrators.

```text
Public Visitor
      │
      ├── Browse published blogs
      │
      └── Register / Sign In
                 │
                 ▼
              User
                 │
                 ├── Create blogs
                 ├── View own blogs
                 └── Delete own blogs


Admin Login
      │
      ▼
    Admin
      │
      ├── Manage all blogs
      ├── Delete any blog
      ├── Manage users
      └── Delete users and their posts
```

Admin accounts cannot log in through the normal User login flow, and normal users cannot access the Admin flow.

Authorization is also checked on the backend so protected actions do not rely only on frontend restrictions.

## MongoDB Data

The application primarily stores:

```text
users
posts
```

User records contain account information, hashed passwords, and roles.

Post records contain blog information along with ownership information linking each post to its creator.

Passwords are **hashed before being stored** and should never be stored as plain text.

## Important Security Notes

* Never upload `.env.local` to GitHub.
* Never expose `MONGODB_URI` or `JWT_SECRET` in frontend code.
* Passwords are hashed before database storage.
* Authentication uses secure HTTP-only cookies.
* Admin authorization is validated on the server.
* Blog ownership is validated before user deletion operations.
* Users cannot delete posts belonging to another user.

## Production Build

To verify that the project builds successfully:

```bash
npm run build
```

To run the production build locally:

```bash
npm start
```

## Future Improvements

Possible future additions include:

* Dedicated User Dashboard page
* Dedicated Admin Dashboard page
* Blog editing
* Image uploads
* Improved comments system
* Bookmarking
* Email verification
* Password reset
* Pagination
* Improved analytics
* Deployment and production hardening

## License

This project is intended for learning, development, and portfolio purposes.
