const express = require('express');
const router = express.Router();
const { getCoursesByStudentId, getGrade } = require('../models/queries');

router.get('/students/:id/courses', async (req, res) => {
  try {
    const courses = await getCoursesByStudentId(req.params.id);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/students/:id/courses/:courseId/grade', async (req, res) => {
  try {
    const { id, courseId } = req.params;
    const result = await getGrade(id, courseId);
    if (result) res.json(result);
    else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
