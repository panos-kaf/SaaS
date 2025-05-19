# Students Courses Service

This microservice is responsible for managing data regarding uploaded grades for each student. It handles course management (adding, viewing) and retrieving grades.

## Features

- Student course registration management
- Grade retrieval for specific courses
- Integration with the post_grades_service for grade data
- Integration with the user_management_service for user data (not yet implemented)

## API Endpoints

### Get Courses
- **Endpoint**: `/api/get-courses/:user_ID`
- **Method**: GET
- **Description**: Retrieves all courses the specific user has added (student)
- **Requirements**: User is logged in
- **Response**: JSON object with courses or error message

### Add Course
- **Endpoint**: `/api/add-course/:course_ID/:user_ID`
- **Method**: POST
- **Description**: Allows the student to add a new course that they can see grades for (if available)
- **Requirements**: User is logged in
- **Response**: JSON object indicating success or failure

### View Grade for a Chosen Subject
- **Endpoint**: `/api/get-grade/:user_ID/:course_ID`
- **Method**: GET
- **Description**: Retrieves grades (if available) for a specific course the student selected
- **Requirements**: User is logged in
- **Response**: JSON object with the grades in the specific course (if available) or error message

### Get All Available Courses
- **Endpoint**: `/api/courses`
- **Method**: GET
- **Description**: Retrieves all available courses in the system
- **Response**: JSON object with all courses

## Setup and Installation

1. Clone the repository
2. Create a `.env` file with the necessary environment variables (see `.env.example`)
3. Run `npm install` to install dependencies
4. Run `docker-compose up -d` to start the service and its dependencies

## Development

- `npm start`: Start the service
- `npm run dev`: Start the service with nodemon for development

## Architecture

This service:
1. Consumes grade data from RabbitMQ (published by the post_grades_service)
2. Stores the data in its database
3. Provides API endpoints for students to manage their courses and view grades

## Database Schema

- **users**: Stores user information
- **courses**: Stores course information
- **student_courses**: Links students to their registered courses
- **grades**: Stores grade information for student-course pairs
