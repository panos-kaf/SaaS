# Grade Statistics Service

## Overview

The Grade Statistics Service is a microservice designed to retrieve grade statistics for specific courses. It provides an API endpoint that allows clients to request statistical data based on course IDs.

## Project Structure

The project is organized as follows:

```
grade_statistics_service
├── src
│   ├── controllers
│   │   └── statisticsController.js
│   ├── routes
│   │   └── statisticsRoutes.js
│   ├── database
│   │   ├── db.js
│   │   └── schema.sql
│   └── index.js
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## API Endpoint

### Get Statistics

- **Endpoint:** `/get-stats/<int:course_ID>`
- **Method:** GET
- **Description:** Retrieves grade statistics for a specific course.
- **Response:** A JSON object containing statistics or an error message.

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd grade_statistics_service
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up the PostgreSQL database:**
   - Ensure PostgreSQL is installed and running.
   - Create a database for the service.
   - Run the SQL commands in `src/database/schema.sql` to set up the necessary tables.

4. **Run the application:**
   ```
   npm start
   ```

5. **Access the API:**
   - Use a tool like Postman or curl to make requests to the API.

## Docker Setup

To run the service in a Docker container, use the following commands:

1. **Build the Docker image:**
   ```
   docker build -t grade_statistics_service .
   ```

2. **Run the Docker container:**
   ```
   docker-compose up
   ```

## License

This project is licensed under the MIT License. See the LICENSE file for details.