const db = require('../database/db');



/*    This service needs fixing, add more API calls, correct statistics etc
*
*
*
*
*/
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

module.exports = new StatisticsController();