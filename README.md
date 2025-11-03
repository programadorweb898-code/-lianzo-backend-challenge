# Project Challenge

This is a backend application built with Node.js, Express, TypeORM, and TypeScript.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd project_challenge
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory based on `.env-example`.

    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    JWT_SECRET=your_jwt_secret
    JWT_REFRESH_SECRET=your_jwt_refresh_secret
    PORT=3000
    ```

4.  **Database Setup:**
    Ensure you have a PostgreSQL database running and update the `.env` file with your database credentials.

## Running the Application

1.  **Start the server:**
    ```bash
    npm start
    ```

    The server will run on the port specified in your `.env` file (default: 3000).

## API Documentation

Access the API documentation (Swagger UI) at `/api/docs` once the server is running.

## Running Tests

```bash
npm test
```