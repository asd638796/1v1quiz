import 'dotenv/config'; 
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

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

app.post('/api/login', async (req, res) => {
  const { username } = req.body;

  try {
    
    

    const result = await pool.query(
      'INSERT INTO users (username) VALUES ($1) ON CONFLICT (username) DO NOTHING RETURNING *',
      [username]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Login successful', user: result.rows[0] });
    } else {
      res.status(200).json({ message: 'User already exists' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
