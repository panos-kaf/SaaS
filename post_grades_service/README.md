# Post Grades Service

This service is responsible for managing grade submissions. It allows users to upload, edit, and delete grade files for courses.

## API Endpoints

All endpoints are prefixed with `/api`.

### 1. Upload and Process Grades
*   **Endpoint:** `/grade-submissions`
*   **Method:** `POST`
*   **Description:** Uploads a new CSV file containing grades, creates a submission record, and processes the grades.
*   **Request Body (multipart/form-data):**
    *   `gradesFile` (File): The CSV file containing the grades.
*   **Authentication:** Required (user_service_id is extracted from the authenticated user)
*   **Response:**
    *   `201 Created`: JSON object with `message` and `submission_id`.
        ```json
        {
          "message": "Grade submission and grades processed successfully.",
          "submission_id": 123
        }
        ```
    *   `400 Bad Request`: JSON object with `error` message if required fields are missing or data is invalid.
    *   `401 Unauthorized`: JSON object with `error` message if user is not authenticated.
    *   `500 Internal Server Error`: JSON object with `error` message if the server encounters an issue.

### 2. Update Grade Submission File
*   **Endpoint:** `/grade-submissions/:submission_id/file`
*   **Method:** `PUT`
*   **Description:** Updates a non-finalized grade submission with a new CSV file.
*   **URL Parameters:**
    *   `submission_id` (Integer): The ID of the submission to update.
*   **Request Body (multipart/form-data):**
    *   `gradesFile` (File): The new CSV file to replace the existing one.
*   **Authentication:** Required (must be the owner of the submission)
*   **Response:**
    *   `200 OK`: JSON object with `message` and `submission_id`.
        ```json
        {
          "message": "Grade submission file updated and grades re-processed successfully.",
          "submission_id": 123
        }
        ```
    *   `400 Bad Request`: JSON object with `error` if `gradesFile` is missing.
    *   `401 Unauthorized`: JSON object with `error` message if user is not authenticated.
    *   `403 Forbidden`: JSON object with `error` if the user is not the owner or if the submission is finalized.
    *   `404 Not Found`: JSON object with `error` if the `submission_id` does not exist.
    *   `500 Internal Server Error`: JSON object with `error` message.

### 3. Delete Grade Submission
*   **Endpoint:** `/grade-submissions/:submission_id`
*   **Method:** `DELETE`
*   **Description:** Deletes a grade submission, all its associated grades, and the CSV file.
*   **URL Parameters:**
    *   `submission_id` (Integer): The ID of the submission to delete.
*   **Authentication:** Required (must be the owner of the submission or an admin)
*   **Response:**
    *   `200 OK`: JSON object with `message` and `submission_id`.
        ```json
        {
          "message": "Grade submission and associated grades deleted successfully",
          "submission_id": 123
        }
        ```
    *   `401 Unauthorized`: JSON object with `error` message if user is not authenticated.
    *   `403 Forbidden`: JSON object with `error` if the user is not the owner or an admin, or if the submission is finalized and the user is not an admin.
    *   `404 Not Found`: JSON object with `error` if the `submission_id` does not exist.
    *   `500 Internal Server Error`: JSON object with `error` message.

### 4. Finalize Grade Submission
*   **Endpoint:** `/grade-submissions/:submission_id/finalize`
*   **Method:** `POST`
*   **Description:** Finalizes a grade submission, preventing further edits.
*   **URL Parameters:**
    *   `submission_id` (Integer): The ID of the submission to finalize.
*   **Authentication:** Required (must be the owner of the submission)
*   **Response:**
    *   `200 OK`: JSON object with `message` and `submission_id`.
        ```json
        {
          "message": "Grade submission finalized successfully. No further edits allowed.",
          "submission_id": 123
        }
        ```
    *   `400 Bad Request`: JSON object with `error` if the submission is already finalized or has no grades.
    *   `401 Unauthorized`: JSON object with `error` message if user is not authenticated.
    *   `403 Forbidden`: JSON object with `error` if the user is not the owner.
    *   `404 Not Found`: JSON object with `error` if the `submission_id` does not exist.
    *   `500 Internal Server Error`: JSON object with `error` message.

## Messaging System

This service publishes grade information to a RabbitMQ message broker using the AMQP protocol. Other services can subscribe to these messages to receive real-time updates about grades.

### Exchange

*   **Exchange Name:** `grades_exchange`
*   **Exchange Type:** `fanout` (broadcasts messages to all bound queues)

### Published Messages

1. **Individual Grades**
   *   Published when grades are uploaded or updated
   *   Format: JSON object containing grade information

2. **Grade Submission Finalization**
   *   Published when a grade submission is finalized
   *   Format:
     ```json
     {
       "event": "grade_submission_finalized",
       "submission_id": 123,
       "timestamp": "2025-05-16T12:34:56.789Z"
     }
     ```

### Consuming Messages

Other services can consume these messages by:
1. Creating a queue
2. Binding the queue to the `grades_exchange` exchange
3. Setting up a consumer to process incoming messages

## Database Schema

The service uses a PostgreSQL database with the following tables:

### `users_profile`
Stores user profile information retrieved from the user management service.

### `grade_submissions`
Stores information about grade file submissions, including their finalization status.

### `grades`
Stores individual grade records extracted from uploaded CSV files.

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
3.  **Create a `.env` file** in the `post_grades_service` directory (optional):
    ```env
    POSTGRES_USER=your_custom_user
    POSTGRES_PASSWORD=your_strong_password
    POSTGRES_DB=post_grades_db
    RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
    ```

4.  **Build and run the containers using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This will start:
    - The Node.js application (accessible at `http://localhost:3002`)
    - The PostgreSQL database (accessible on host port `5435`)
    - RabbitMQ (AMQP on port `5672`, Management UI on port `15672`)

5.  **To stop the services:**
    ```bash
    docker-compose down
    ```

### CSV File Format

The service expects CSV files with the following headers:
* `course_id`: ID of the course from another service
* `prof_id`: ID of the professor from another service
* `student_academic_number`: Academic number of the student
* `student_name`: Full name of the student
* `student_email`: Email of the student (optional)
* `semester`: The semester/year of the course (e.g., "2024-Spring")
* `course_name`: Name of the course
* `course_code`: Course code
* `grade_scale`: The scale used for grading (e.g., "0-10", "A-F")
* `grade`: The actual grade

Example:
```csv
course_id,prof_id,student_academic_number,student_name,student_email,semester,course_name,course_code,grade_scale,grade
CS101,PROF456,ST12345,John Doe,john.doe@example.com,2025-Spring,Introduction to Computer Science,CS101,0-10,8.5
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