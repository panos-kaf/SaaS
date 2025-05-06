const express = require('express');
const gradesRoutes = require('./routes/grades');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', gradesRoutes);

app.listen(PORT, () => {
  console.log(`Grades service running on port ${PORT}`);
});
