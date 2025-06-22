# MICROSERVICE

## Institution Service

A microservice responsible for managing institution enrollment, credit management, and course registration in the academic system. This service handles institutions joining the platform, purchasing credits for system usage, and registering their courses.

### API Endpoints

1. **Enroll Institution**
   - Endpoint: `/add-inst/`
   - Method: POST
   - Description: Enrolls the institution to the service
   - Requirements: User is an authorized institution member
   - Response: JSON object with institution_ID or error message

2. **Add Credits**
   - Endpoint: `/add-creds/:institution_ID`
   - Method: POST
   - Description: Allows the institution manager to buy credits for the institution
   - Requirements: User is logged in, amount of credits etc
   - Response: JSON object with purchase_ID, amount of credits available etc or error message

3. **Register Courses**
   - Endpoint: `/register_courses/:institution_ID`
   - Method: POST
   - Description: Registers the courses for this academic year
   - Requirements: User is logged in and the correct courses file is uploaded
   - Response: JSON object indicating success or error

4. **View Credits**
   - Endpoint: `/view-creds/:institution_ID`
   - Method: GET
   - Description: Allows the institution manager to view the amount of credits the institution has
   - Requirements: User is logged in
   - Response: JSON object with amount of credits

### Database Schema

The database includes the following tables:

- **institutions**: Stores institution information
  - institution_id (primary key)
  - institution_name
  - institution_email
  - institution_address
  - contact_person
  - contact_email
  - contact_phone
  - manager_user_id (foreign key to user service)
  - status (active, inactive, suspended)
  - created_at
  - updated_at

- **institution_credits**: Stores credit information for institutions
  - credit_id (primary key)
  - institution_id (foreign key)
  - total_credits
  - used_credits
  - available_credits
  - last_updated

- **credit_transactions**: Stores credit purchase history
  - transaction_id (primary key)
  - institution_id (foreign key)
  - amount
  - transaction_type (purchase, usage)
  - purchase_id (for purchases)
  - timestamp
  - description

- **institution_courses**: Stores course information for institutions
  - course_id (primary key)
  - institution_id (foreign key)
  - course_code
  - course_name
  - department
  - semester
  - academic_year
  - professor_id
  - created_at

### Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Docker
- RabbitMQ for message exchange