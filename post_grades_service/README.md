# Post Grades Service

This service is responsible for managing grade submissions. It allows users to upload, edit, and delete grade files for courses.

## API Endpoints

All endpoints are prefixed with `/api`.

### 1. Post Grades
*   **Endpoint:** `/post-grades`
*   **Method:** `POST`
*   **Description:** Uploads a new set of grades for a specific course.
*   **Request Body (multipart/form-data):**
    *   `course_name` (String): Name of the course.
    *   `exam_period` (String): The examination period (e.g., "June 2024").
    *   `date` (String): Date of the exam/submission (Format: YYYY-MM-DD).
    *   `professor` (String): Name of the professor.
    *   `gradesFile` (File): The CSV file containing the grades.
*   **Response:**
    *   `201 Created`: JSON object with `message` and `grades_id`.
        ```json
        {
          "message": "Grades posted successfully",
          "grades_id": 123
        }
        ```
    *   `400 Bad Request`: JSON object with `error` message if required fields are missing or data is invalid.
    *   `500 Internal Server Error`: JSON object with `error` message if the server encounters an issue.

### 2. Edit Grades
*   **Endpoint:** `/edit-grades/<grades_ID>`
*   **Method:** `PUT` (Note: Changed from UPDATE to PUT for RESTful conventions)
*   **Description:** Updates an already saved grade submission with a new CSV file.
*   **URL Parameters:**
    *   `grades_ID` (Integer): The ID of the grade entry to update.
*   **Request Body (multipart/form-data):**
    *   `gradesFile` (File): The new CSV file to replace the existing one.
*   **Response:**
    *   `200 OK`: JSON object with `message` and `grades_id`.
        ```json
        {
          "message": "Grades updated successfully",
          "grades_id": 123
        }
        ```
    *   `400 Bad Request`: JSON object with `error` if `gradesFile` is missing.
    *   `404 Not Found`: JSON object with `error` if the `grades_ID` does not exist.
    *   `500 Internal Server Error`: JSON object with `error` message.

### 3. Delete Grades
*   **Endpoint:** `/delete-grades/<grades_ID>`
*   **Method:** `DELETE`
*   **Description:** Deletes a grade registration from the database and the associated file from storage.
*   **URL Parameters:**
    *   `grades_ID` (Integer): The ID of the grade entry to delete.
*   **Response:**
    *   `200 OK`: JSON object with `message` and `grades_id`.
        ```json
        {
          "message": "Grades deleted successfully",
          "grades_id": 123
        }
        ```
    *   `404 Not Found`: JSON object with `error` if the `grades_ID` does not exist.
    *   `500 Internal Server Error`: JSON object with `error` message.

## Setup and Running the Service

### Prerequisites
*   Node.js (v18 or later recommended)
*   npm
*   Docker
*   Docker Compose

### Local Development

1.  **Clone the repository (if you haven't already).**
2.  **Navigate to the service directory:**
    ```bash
    cd post_grades_service
    ```
3.  **Create a `.env` file** in the `post_grades_service` directory (optional, for overriding default environment variables in `docker-compose.yml`):
    ```env
    POSTGRES_USER=your_custom_user
    POSTGRES_PASSWORD=your_strong_password
    POSTGRES_DB=post_grades_db
    # POST_GRADES_PORT=3002 # Already set in docker-compose
    # NODE_ENV=development # Already set in docker-compose
    ```
    If you create a `.env` file, make sure the `POSTGRES_USER` and `POSTGRES_PASSWORD` here match the ones you might set for the `post-grades-db` service in the `docker-compose.yml` or its own environment variables if you customize them there. The defaults in `docker-compose.yml` are `your_db_user` and `your_db_password`.

4.  **Build and run the containers using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This will start the Node.js application and the PostgreSQL database. The application will be accessible at `http://localhost:3002`. The PostgreSQL database will be accessible on host port `5435`.

5.  **To stop the services:**
    ```bash
    docker-compose down
    ```

### Database
*   The service uses a PostgreSQL database.
*   The schema is defined in `src/database/schema.sql` and is automatically applied when the `post-grades-db` container starts for the first time.
*   Database connection details are configured in `src/database/db.js` and can be overridden using environment variables (see `docker-compose.yml`).
*   A volume `postgres_post_grades_data` is used to persist database data.

### File Uploads
*   Uploaded CSV files are stored in the `uploads/` directory within the `post_grades_service` directory on the host machine (this is mapped to `/usr/src/app/uploads` in the `post-grades-app` container).
*   Ensure the `uploads/` directory is writable by the application. The controller attempts to create it if it doesn't exist.

### Running Tests (Placeholder)
```bash
npm test
```
(Currently, this will just echo "Error: no test specified")

## Project Structure
```
post_grades_service/
├── src/
│   ├── controllers/
│   │   └── gradesController.js  # Handles business logic for grade operations
│   ├── routes/
│   │   └── gradesRoutes.js      # Defines API routes
│   ├── database/
│   │   ├── db.js                # Configures database connection
│   │   └── schema.sql           # Database table schema
│   └── index.js                 # Main application entry point
├── uploads/                     # Directory for storing uploaded grade files (created automatically)
├── Dockerfile                   # Defines the Docker image for the application
├── docker-compose.yml           # Defines services, networks, and volumes for Docker
├── package.json                 # Project metadata and dependencies
└── README.md                    # This file
```

## Environment Variables
The following environment variables can be set to configure the application (defaults are provided in `docker-compose.yml` or the code):

*   `NODE_ENV`: Application environment (e.g., `development`, `production`).
*   `POST_GRADES_PORT`: Port for the application to listen on (default: `3002`).
*   `POSTGRES_USER`: PostgreSQL database user.
*   `POSTGRES_PASSWORD`: PostgreSQL database password.
*   `POSTGRES_DB`: PostgreSQL database name.
*   `POSTGRES_HOST`: Hostname of the PostgreSQL server (e.g., `post-grades-db` when using Docker Compose).
*   `POSTGRES_PORT`: Port of the PostgreSQL server (default: `5432` for the container, host port may vary).

Make sure to replace placeholder credentials like `your_db_user` and `your_db_password` with strong, unique credentials in your actual deployment or local `.env` file.