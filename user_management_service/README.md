# MICROSERVICE

## User Management Service

A microservice responsible for user authentication, including sign up and sign in functionality. The service stores encrypted user credentials and profile information, and provides JWT-based authentication for other services within the system.

### Features
- User registration (sign up)
- User authentication (sign in)
- Secure password storage with encryption and salting
- JWT generation for inter-service authentication
- User profile management

### API Endpoints
- POST /add-user/ - Register a new user
- POST /add-creds/:institution_id - Sign in user and provide JWT token