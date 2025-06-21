// api_gateway/config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,

  // Microservice URLs
services: {
  userManagement: process.env.USER_MANAGEMENT_URL || 'http://user_management_app:3001',
  studentsCourses: process.env.STUDENTS_COURSES_URL || 'http://students_courses_app:3002',
  gradeStatistics: process.env.GRADE_STATISTICS_URL || 'http://grade_statistics_app:3003',
  requests: process.env.REQUESTS_SERVICE_URL || 'http://requests_app:3005',
  replies: process.env.REPLIES_SERVICE_URL || 'http://replies_app:3006',
  postGrades: process.env.POST_GRADES_URL || 'http://post_grades_app:3004',
  institution: process.env.INSTITUTION_SERVICE_URL || 'http://institution_app:3007',
},

  jwt: {
    secret: process.env.JWT_SECRET || 'gateway_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  }
};