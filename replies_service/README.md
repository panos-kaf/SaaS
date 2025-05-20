# MICROSERVICE

## Replies Service

A microservice responsible for managing replies to grade review requests in the academic system. This service allows professors and students to communicate regarding grade review requests, maintaining a conversation thread for each request.

### API Endpoints

1. **Create Reply**
   - Endpoint: `/create-reply/:requestID`
   - Method: POST
   - Description: Creates a new reply for a specific review request
   - Requirements: User is logged in
   - Response: JSON object containing the reply ID or appropriate error message

2. **Delete Reply**
   - Endpoint: `/delete-reply/:replyID`
   - Method: DELETE
   - Description: Deletes a reply, user needs to have ownership of reply
   - Response: Success or appropriate error message

3. **View Replies**
   - Endpoint: `/view-replies/:requestID`
   - Method: GET
   - Description: Retrieves all replies for a specific request
   - Requirements: User is logged in and has access to the request
   - Response: JSON object containing the replies or appropriate error message

### Database Schema

The database includes the following tables:

- **replies**: Stores information about individual replies
  - reply_id (primary key)
  - request_id (foreign key to requests table)
  - user_id (owner of the reply)
  - reply_body
  - timestamp

- **requests**: Cached data from requests_service
  - request_id (primary key)
  - owner_id
  - grade_id
  - prof_id
  - request_body
  - status
  - timestamp

- **users_profile**: Cached data from user_management_service
  - user_profile_id (primary key)
  - user_service_id (ID from the User Management service)
  - academic_id
  - full_name
  - email
  - role
  - institution_id
  - department
  - created_at
  - updated_at

### Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Docker
- RabbitMQ for message exchange