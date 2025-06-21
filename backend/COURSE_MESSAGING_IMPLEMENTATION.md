# Course Data Coherence Implementation

## Overview

This document describes the implementation of course data coherence across services using a fanout exchange messaging pattern. The implementation ensures that course data is synchronized between the institution service (source of truth) and the consuming services (post_grades, students_courses, grade_statistics).

## Architecture

### Services Involved

1. **Institution Service** - Source of truth for course data
   - Publishes course events when courses are created/updated/deleted
   - Stores course data in `institution_courses` table

2. **Post Grades Service** - Consumer
   - Subscribes to course events
   - Maintains local cache of course data in `institution_courses` table
   - Validates course_id in uploaded grade files against cached data

3. **Students Courses Service** - Consumer
   - Subscribes to course events
   - Maintains local cache of course data in `institution_courses` table
   - Validates course registrations against cached data

4. **Grade Statistics Service** - Consumer
   - Subscribes to course events
   - Maintains local cache of course data in `institution_courses` table
   - Uses course data for statistics calculations

### Messaging Pattern

**Exchange**: `courses_exchange` (type: fanout)
**Routing**: Fanout exchange broadcasts to all bound queues

**Queues**:
- `post_grades_courses_queue`
- `students_courses_courses_queue`
- `grade_statistics_courses_queue`

### Event Types

- `COURSE_CREATED`: Published when a new course is registered
- `COURSE_UPDATED`: Published when course data is modified
- `COURSE_DELETED`: Published when a course is removed

## Implementation Details

### Institution Service (Publisher)

**Publisher Configuration**:
```javascript
// config/config.js
COURSES_EXCHANGE: 'courses_exchange'

// messaging/publisher.js
async publishCourseEvent(courseData) {
  const message = JSON.stringify(courseData);
  this.channel.publish(
    this.coursesExchange,
    '', // Empty routing key for fanout
    Buffer.from(message),
    { persistent: true }
  );
}
```

**Course Registration**:
- When courses are registered via `/register_courses/:institution_ID`
- Each successfully created course triggers a `COURSE_CREATED` event
- Uses `coursesService.publishCourseEvent()` to send events

### Consumer Services

**Subscriber Implementation**:
Each service has a `coursesSubscriber.js` with:
- Connection to `courses_exchange`
- Queue binding with service-specific queue name
- Event handlers for COURSE_CREATED, COURSE_UPDATED, COURSE_DELETED

**Database Schema**:
All consumer services have an `institution_courses` table:
```sql
CREATE TABLE IF NOT EXISTS institution_courses (
    course_id INTEGER PRIMARY KEY, -- ID from institution service
    institution_id INTEGER NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    professor_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Data Validation

### Course Identity

**Important**: Course identity is determined by the combination of `course_code` AND `academic_year`. This ensures data coherence when the same course is taught across different academic years:

- Physics (course_code: "PHYS101") in "2023-2024" has a different `course_id` than Physics "PHYS101" in "2024-2025"
- All services use `course_code + academic_year` lookup to find the correct `course_id`
- This prevents data mixing between different instances of the same course

### Post Grades Service

**CSV Upload Validation**:
- CSV format no longer requires `course_id` column
- Uses `course_code + academic_year` to look up `course_id` from `institution_courses`
- Validates existence before processing grades
- Skips grades for non-existent course combinations with warning logs

**XLSX Upload Validation**:
- Extracts `course_code` from course name field and `academic_year` from academic year field
- Looks up `course_id` from `institution_courses` using `course_code + academic_year`
- Validates existence before processing grades

### Students Courses Service

**Course Registration Validation**:
- `addCourseForUser()` validates course_id against `institution_courses`
- `getAllCourses()` returns courses from `institution_courses` (not local `courses` table)

## Setup and Synchronization

### Initial Setup

1. **Install Dependencies**:
   All services should already have `amqplib` installed

2. **Configure Environment**:
   ```bash
   COURSES_EXCHANGE=courses_exchange
   RABBITMQ_URL=amqp://rabbitmq:5672
   ```

3. **Database Schema Updates**:
   - Grade Statistics Service: Added `institution_courses` table
   - Other services: Already had the table

### Synchronizing Existing Data

**Option 1: API Endpoint**
```bash
POST /api/sync_courses/:institution_ID
```
- Use this endpoint to sync courses for a specific institution
- Requires institution manager authentication

**Option 2: Sync Script**
```bash
node sync-courses.js
```
- Utility script to sync all existing courses
- Publishes COURSE_CREATED events for all courses in institution database

### Verification

1. **Check Message Consumption**:
   - Monitor service logs for course event processing
   - Verify `institution_courses` tables are populated in all services

2. **Test Course Validation**:
   - Try uploading grades with invalid course_id (should be rejected)
   - Try registering for invalid course (should be rejected)
   - Get list of available courses from students service

3. **Database Consistency**:
   ```sql
   -- Check course counts across services
   SELECT COUNT(*) FROM institution_courses; -- Run in each service
   ```

## Endpoints Modified

### Institution Service
- `POST /register_courses/:institution_ID` - Now publishes course events
- `POST /sync_courses/:institution_ID` - New endpoint for synchronization

### Students Courses Service
- `POST /add-course/:course_ID` - Now validates against institution_courses
- `GET /courses` - Now returns courses from institution_courses

### Post Grades Service
- `POST /grade-submissions` - Now validates courses in uploaded files
- Course validation added to both CSV and XLSX processing

## Error Handling

### Publisher (Institution Service)
- Course creation continues even if messaging fails
- Errors logged but don't block response
- Manual sync available if messaging was down

### Subscribers (Consumer Services)
- Invalid course events are logged and ignored
- Connection failures trigger automatic retry with backoff
- Failed message processing requeues message for retry

### File Upload Validation
- Invalid course references are logged and skipped
- Partial processing succeeds for valid courses
- Clear error messages for debugging

## Monitoring and Troubleshooting

### Log Messages to Monitor

**Institution Service**:
- "Course event published: COURSE_CREATED"
- "Failed to publish course created event"

**Consumer Services**:
- "Course created/updated in cache: [course_id]"
- "Course with code [code] not found in institution courses"
- "Courses subscriber listening on queue: [queue_name]"

### Common Issues

1. **Missing Course Events**:
   - Check if courses existed before messaging implementation
   - Use sync endpoint or script to publish events for existing courses

2. **Queue Not Consuming**:
   - Verify RabbitMQ connection
   - Check exchange and queue bindings
   - Restart consumer service

3. **Course Validation Failures**:
   - Verify course data was published and consumed
   - Check for typos in course_code or academic_year
   - Compare institution_courses tables across services

## Best Practices

1. **Always validate course references** before processing business logic
2. **Log course validation failures** for debugging
3. **Use manual sync** after any messaging outages
4. **Monitor message queue depths** to detect processing issues
5. **Test with invalid course data** to verify validation works
