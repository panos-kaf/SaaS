const pool = require('../db');

async function getCoursesByStudentId(studentId) {
  const res = await pool.query(`
    SELECT c.id, c.name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = $1
  `, [studentId]);
  return res.rows;
}

async function getGrade(studentId, courseId) {
  const res = await pool.query(`
    SELECT grade
    FROM enrollments
    WHERE student_id = $1 AND course_id = $2
  `, [studentId, courseId]);
  return res.rows[0];
}

module.exports = { getCoursesByStudentId, getGrade };
