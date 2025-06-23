# NTUA ECE SAAS 2025 PROJECT (saas-25-10)

onomata

## Academic Grade Management System

This project implements a comprehensive microservices-based academic grade management system that enables professors to upload grades, students to view their grades, and facilitates the review request process between students and professors.

## Architecture

The system consists of six core microservices:

1. **User Management Service** (Port 3001)
   - Handles user authentication and profile management
   - JWT token generation for service authentication
   - User profile propagation to other services via messaging

2. **Post Grades Service** (Port 3004)
   - Enables professors to upload and manage grade submissions
   - Processes grade files and stores grade data
   - Publishes grade events to other services

3. **Students Courses Service** (Port 3002)
   - Manages student course registrations
   - Provides grade information to students
   - Integrates with the grade submission system

4. **Requests Service** (Port 3005)
   - Handles grade review requests from students to professors
   - Tracks request status and management
   - Coordinates with replies and grade services

5. **Replies Service** (Port 3006)
   - Manages communication threads for grade review requests
   - Stores replies from both students and professors
   - Maintains conversation history

6. **Grade Statistics Service** (Port 3003)
   - Calculates and provides statistical analysis of grades
   - Tracks metrics like average, minimum, maximum and standard deviation
   - Updates statistics when new grades are posted

7. **Institution Service** (Port 3007)
   - Manages institution-related data and operations
   - Integrates with user and course management

Each service maintains its own database for data isolation while sharing a common RabbitMQ messaging system for inter-service communication.

## System Requirements

- Docker and Docker Compose
- Node.js (for local development)
- PostgreSQL (handled by Docker for production)
- RabbitMQ (handled by Docker for production)

## Getting Started

### Running the Entire System

The system uses a unified Docker Compose configuration to run all services together. From the project root directory:

```bash
# Start all services
docker-compose up -d

# Check the status of all services
docker-compose ps

# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f <service_name>
# Example: docker-compose logs -f user_management_app
```

### Stopping the System

```bash
# Stop all services but keep volumes
docker-compose down

# Stop all services and remove volumes (will delete all data)
docker-compose down -v
```

### Rebuilding Services After Code Changes

```bash
# Rebuild and restart a specific service
docker-compose up -d --build <service_name>
# Example: docker-compose up -d --build user_management_app

# Rebuild and restart all services
docker-compose up -d --build
```

## Service Access

Once the system is running, you can access the services at:

- API Gateway: http://localhost:3000
- Frontend: http://localhost:4000
- User Management Service: http://localhost:3001
- Post Grades Service: http://localhost:3004
- Students Courses Service: http://localhost:3002
- Requests Service: http://localhost:3005
- Replies Service: http://localhost:3006
- Grade Statistics Service: http://localhost:3003
- Institution Service: http://localhost:3007
- RabbitMQ Management UI: http://localhost:15672 (username: guest, password: guest)

## Health Check Endpoints

Each service provides a health check endpoint at `/health` that returns the service status:

```bash
# Example health check
curl http://localhost:3007/health
```

## Development

For development on individual services, refer to the README.md in each service directory for specific instructions.

## Database Management

Each service has its own PostgreSQL database:

- User Management DB: Port 5437
- Post Grades DB: Port 5435
- Requests DB: Port 5433
- Replies DB: Port 5436
- Students Courses DB: Port 5434
- Grade Statistics DB: Port 5438
- Institution DB: Port 5439

You can connect to these databases using any PostgreSQL client with the following credentials:
- Username: postgres
- Password: postgres
- Host: localhost
- Port: As listed above for each service

## Messaging System

The services communicate through a centralized RabbitMQ instance:
- The RabbitMQ management interface is available at http://localhost:15672
- Default credentials: guest/guest
- AMQP port: 5673

## Troubleshooting

If you encounter issues:

1. Check container logs: `docker-compose logs -f <service_name>`
2. Verify all services are running: `docker-compose ps`
3. Ensure all databases are initialized properly: `docker-compose exec <db_service_name> psql -U postgres -d <db_name> -c "\dt"`
4. Check RabbitMQ is operational: Access the management UI at http://localhost:15672

## Security Notes

For production deployment, be sure to:
1. Change all default passwords
2. Use environment variables for sensitive information
3. Implement TLS/SSL for service communication
4. Set up proper network isolation