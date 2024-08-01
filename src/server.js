import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static(path.join(path.dirname(''), 'public')));

// Endpoint to save questions
app.post('/api/save-questions', (req, res) => {
  const questions = req.body;
  const questionsPath = 'C:/Users/sheri/desktop/stuff/cs/1v1quiz/public/questions.json';

  fs.writeFile(questionsPath, JSON.stringify(questions, null, 2), (err) => {
    if (err) {
      console.error('Error saving questions:', err);
      res.status(500).json({ error: 'Failed to save questions' });
    } else {
      res.status(200).json({ message: 'Questions saved successfully' });
    }
  });
});

// Endpoint to fetch questions
app.get('/api/questions', (req, res) => {
  const questionsPath = 'C:/Users/sheri/desktop/stuff/cs/1v1quiz/public/questions.json';

  fs.readFile(questionsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading questions:', err);
      res.status(500).json({ error: 'Failed to fetch questions' });
    } else {
      res.status(200).json(JSON.parse(data));
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
