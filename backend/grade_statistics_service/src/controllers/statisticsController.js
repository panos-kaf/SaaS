const db = require('../database/db');



/*    This service needs fixing, add more API calls, correct statistics etc
*
*
*
*

class StatisticsController {
    async getStatistics(req, res) {
        const courseId = req.params.course_ID;

        try {
            // Query for grade statistics
            const result = await db.query('SELECT * FROM grade_statistics WHERE course_id = $1', [courseId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No statistics found for this course.' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error retrieving statistics:', error);
            res.status(500).json({ error: 'An error occurred while retrieving statistics.' });
        }
    }
}

module.exports = StatisticsController;

//module.exports = StatisticsController();

*/

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
        GROUP BY gs.course_id, gs.semester, gs.submission_date, gs.is_finalized, g.course_name, g.grade
        ORDER BY gs.course_id, g.grade ASC`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  }
}
module.exports = StatisticsController;