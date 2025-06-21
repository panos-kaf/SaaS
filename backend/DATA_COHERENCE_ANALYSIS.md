# Data Coherence Analysis and Fixes

## Overview
This document outlines the data coherence issues found between the post_grades_service and grade_statistics_service, and the fixes applied to ensure proper data flow and consistency.

## Issues Identified

### 1. Missing course_id in post_grades_service Schema
**Problem**: The post_grades_service schema had course_id commented out, but the controller code expected it.
**Impact**: Grade data couldn't be properly categorized by course for statistics.
**Fix**: Re-added course_id to both grade_submissions and grades tables in post_grades_service.

### 2. Schema Inconsistency Between Services
**Problem**: grade_statistics_service subscriber expected course_id in grades table, but schema didn't have it.
**Impact**: Subscriber would fail when trying to insert/update grades.
**Fix**: Removed course_id from grades table operations in subscriber, using join with submissions instead.

### 3. Incomplete Submission Tracking
**Problem**: Grade submissions weren't being created with complete information in statistics service.
**Impact**: Statistics couldn't be properly calculated or tracked per submission.
**Fix**: Enhanced submission creation with proper validation and course_id derivation.

## Data Flow Architecture

```
Post Grades Service                    Grade Statistics Service
─────────────────────                  ─────────────────────────

grade_submissions                      grade_submissions
├── submission_id (PK)          ──>    ├── submission_id (PK)
├── owner_user_service_id              ├── course_id
├── course_id                          ├── prof_id
├── file_path                          ├── semester
├── finalized                          ├── submission_date
├── created_at                         ├── is_finalized
└── updated_at                         ├── created_at
                                       └── updated_at
grades                                 
├── grades_id (PK)              ──>    grades
├── course_id                          ├── grades_id (PK)
├── prof_id                            ├── prof_id
├── student_academic_number            ├── student_academic_number
├── student_name                       ├── student_name
├── student_email                      ├── student_email
├── semester                           ├── semester
├── course_name                        ├── course_name
├── course_code                        ├── course_code
├── grade_scale                        ├── grade_scale
├── grade                              ├── grade
├── submission_id (FK)                 ├── submission_id (FK)
├── created_at                         ├── created_at
└── updated_at                         └── updated_at
```

## Messaging Flow

1. **Grade Creation/Update in Post Grades Service**
   - Grades are inserted/updated in post_grades_service database
   - Each grade is published to RabbitMQ `grades_exchange` (fanout)

2. **Grade Statistics Service Consumption**
   - Listens to `grades_exchange` via `grade_statistics_queue`
   - Processes each grade message:
     - Creates submission record if doesn't exist
     - Inserts/updates grade record
     - Calculates and updates statistics for the course

3. **Course Statistics Calculation**
   - Uses JOIN query: `grades INNER JOIN grade_submissions ON submission_id`
   - Calculates: count, average, min, max, standard deviation
   - Stores in `grade_statistics` table

## Key Fixes Applied

### 1. Post Grades Service Schema Updates
```sql
-- Added course_id back to grade_submissions
ALTER TABLE grade_submissions ADD COLUMN course_id VARCHAR(255) NOT NULL;

-- Added course_id back to grades  
ALTER TABLE grades ADD COLUMN course_id VARCHAR(255) NOT NULL;
```

### 2. Grade Statistics Service Subscriber Updates
```javascript
// Enhanced validation
if (!grade.submission_id) {
  console.warn('Grade message missing submission_id:', grade);
  return;
}

// Improved course_id derivation
const courseId = grade.course_id || `${grade.course_code || 'UNKNOWN'}-${grade.semester || 'UNKNOWN'}`;

// Fixed statistics query with JOIN
const gradesResult = await db.query(
  `SELECT g.grade FROM grades g 
   INNER JOIN grade_submissions gs ON g.submission_id = gs.submission_id 
   WHERE gs.course_id = $1`,
  [courseId]
);
```

### 3. Defensive Programming
- Added null checks for optional fields
- Graceful handling of missing course_id by deriving from available data
- Proper error logging and continuation on non-critical failures

## Data Coherence Verification

### Required Fields for Proper Operation
1. **submission_id**: Must be present for linking grades to submissions
2. **course_id**: Required for statistics calculation (derived if missing)
3. **grade**: Must be numeric for statistical calculations
4. **semester**: Used for temporal organization

### Validation Rules
- submission_id cannot be null
- course_id is derived if not provided: `{course_code}-{semester}`
- Non-numeric grades are filtered out of statistics
- Missing optional fields default to null or 'Unknown'

## Benefits of These Fixes

1. **Data Integrity**: Proper foreign key relationships maintained
2. **Fault Tolerance**: Service continues operation even with incomplete data
3. **Statistics Accuracy**: Course-based statistics properly calculated
4. **Traceability**: Full submission tracking with metadata
5. **Scalability**: Efficient queries using proper indexes and joins

## Monitoring Recommendations

1. **Monitor RabbitMQ Queue Depths**: Ensure grade_statistics_queue doesn't build up
2. **Track Failed Grade Processing**: Log and alert on grade processing failures
3. **Validate Statistics Accuracy**: Periodic validation of calculated vs actual statistics
4. **Monitor Data Completeness**: Track percentage of grades with complete metadata

## Future Enhancements

1. **Course ID Standardization**: Implement consistent course_id generation across services
2. **Real-time Statistics Updates**: Consider streaming statistics updates for real-time dashboards
3. **Data Quality Metrics**: Track and report data quality scores
4. **Automatic Data Repair**: Implement background jobs to fix incomplete historical data
