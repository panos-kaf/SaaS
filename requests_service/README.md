# MICROSERVICE

## Requests Service

A microservice responsible for managing grade review requests in the academic system. This service handles creating, viewing, and managing requests from students to professors for grade reviews.

### API Endpoints

1. **Post Request**
   - Endpoint: `/post-request/:courseID/:userID`
   - Method: POST
   - Description: Creates a new review request for a specific subject
   - Requirements: User is logged in (student role)
   - Response: JSON object containing the request ID or appropriate error message

2. **Delete Request**
   - Endpoint: `/delete-request/:requestID`
   - Method: DELETE
   - Description: Deletes a review request, user needs to have ownership of request
   - Response: Success or appropriate error message

3. **View Request**
   - Endpoint: `/view-requests/:userID`
   - Method: GET
   - Description: Retrieves all requests made by the specific student or all requests made to a specific professor
   - Requirements: User is logged in
   - Response: JSON object containing the requests or appropriate error message

4. **Close request**
   - Endpoint: `/close-request/:requestID`
   - Method: POST
   - Description: Finalizes a request and changes its status to closed. No more replies or edits can be done.
   - Requirements: User is logged in and owns the request
   - Response: JSON object containing success or failure

### Database Schema

The requests table includes:
- owner_id (owner of the request)
- request_id (primary key)
- grade_id
- prof_id
- request_body
- status (open or closed)
- timestamp

### Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Docker