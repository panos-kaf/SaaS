# Institution Service API Examples

This document provides examples of how to use the Institution Service API endpoints.

## Prerequisites

1. Start the institution service using Docker:
```bash
cd institution_service
docker-compose up -d
```

2. Or run the entire backend stack:
```bash
cd backend
docker-compose up -d
```

## API Examples

### 1. Enroll Institution

**Endpoint:** `POST /add-inst/`

```bash
curl -X POST http://localhost:3000/institutions/add-inst/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "institution_name": "University of Technology",
    "institution_email": "admin@university.edu",
    "institution_address": "123 University Ave, Tech City, TC 12345",
    "contact_person": "Dr. John Smith",
    "contact_email": "john.smith@university.edu",
    "contact_phone": "+1-555-123-4567"
  }'
```

### 2. Add Credits

**Endpoint:** `POST /add-creds/:institution_ID`

```bash
curl -X POST http://localhost:3000/institutions/add-creds/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1000,
    "description": "Initial credit purchase for semester operations"
  }'
```

### 3. View Credits

**Endpoint:** `GET /view-creds/:institution_ID`

```bash
curl -X GET http://localhost:3000/institutions/view-creds/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Register Courses

**Endpoint:** `POST /register_courses/:institution_ID`

```bash
curl -X POST http://localhost:3000/institutions/register_courses/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "courses": [
      {
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science",
        "department": "Computer Science",
        "semester": "Fall",
        "academic_year": "2025",
        "professor_id": 123
      },
      {
        "course_code": "MATH201",
        "course_name": "Calculus II",
        "department": "Mathematics",
        "semester": "Fall",
        "academic_year": "2025",
        "professor_id": 456
      }
    ]
  }'
```

## Response Examples

### Successful Institution Enrollment
```json
{
  "success": true,
  "message": "Institution enrolled successfully",
  "institution_id": 1,
  "data": {
    "institution_id": 1,
    "institution_name": "University of Technology",
    "institution_email": "admin@university.edu",
    "contact_person": "Dr. John Smith",
    "contact_email": "john.smith@university.edu",
    "status": "active"
  }
}
```

### Successful Credit Addition
```json
{
  "success": true,
  "message": "Credits added successfully",
  "data": {
    "purchase_id": "uuid-123-456-789",
    "amount_added": 1000,
    "total_credits": 1000,
    "available_credits": 1000,
    "used_credits": 0,
    "institution_name": "University of Technology"
  }
}
```

### View Credits Response
```json
{
  "success": true,
  "data": {
    "institution_id": 1,
    "institution_name": "University of Technology",
    "status": "active",
    "credits": {
      "total_credits": 1000,
      "used_credits": 0,
      "available_credits": 1000,
      "last_updated": "2025-06-21T10:30:00.000Z"
    },
    "recent_transactions": [
      {
        "transaction_id": 1,
        "amount": 1000,
        "transaction_type": "purchase",
        "purchase_id": "uuid-123-456-789",
        "timestamp": "2025-06-21T10:30:00.000Z",
        "description": "Initial credit purchase for semester operations"
      }
    ]
  }
}
```

### Successful Course Registration
```json
{
  "success": true,
  "message": "Course registration completed",
  "data": {
    "institution_id": 1,
    "institution_name": "University of Technology",
    "successful_registrations": 2,
    "failed_registrations": 0,
    "successful_courses": [
      {
        "course_id": 1,
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science",
        "department": "Computer Science",
        "semester": "Fall",
        "academic_year": "2025"
      },
      {
        "course_id": 2,
        "course_code": "MATH201",
        "course_name": "Calculus II",
        "department": "Mathematics",
        "semester": "Fall",
        "academic_year": "2025"
      }
    ],
    "failed_courses": []
  }
}
```

## Error Responses

### Authentication Error
```json
{
  "message": "Authentication token is missing"
}
```

### Authorization Error
```json
{
  "message": "Access denied: You are not the manager of this institution"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Institution name, email, contact person, and contact email are required"
}
```

## Notes

1. All endpoints except health check require JWT authentication
2. Institution management endpoints require either `institution_manager` or `admin` role
3. Credit and course management endpoints require the user to be the manager of the specific institution
4. The service runs on port 3007 by default
5. Database port is 5439 to avoid conflicts with other services
6. The service integrates with RabbitMQ for event publishing and user data synchronization
