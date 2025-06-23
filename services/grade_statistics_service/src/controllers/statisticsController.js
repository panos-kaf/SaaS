const db = require('../database/db');

class StatisticsController {
  async getStatistics(req, res) {
    const { courseId } = req.params;
    try {
      const result = await db.query(
        `SELECT 
          gs.course_id,
          gs.semester AS exam_period,
          gs.submission_date,
          gs.is_finalized,
          g.course_name,
          g.grade,
          COUNT(*) AS grade_count
        FROM grade_submissions gs
        JOIN grades g ON gs.submission_id = g.submission_id
        WHERE gs.course_id = $1
        GROUP BY gs.course_id, gs.semester, gs.submission_date, gs.is_finalized, g.course_name, g.grade
        ORDER BY gs.course_id, g.grade ASC`,
        [courseId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No statistics found for this course.' });
      }
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error retrieving statistics:', err);
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  }
}

module.exports = StatisticsController;