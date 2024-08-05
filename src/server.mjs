import dotenvx from '@dotenvx/dotenvx';
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookie from 'cookie'

dotenvx.config()

const { Pool } = pkg;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

app.use(cookieParser());
app.use(bodyParser.json()); 
app.use(express.static(path.join(path.dirname(''), 'public')));



// PostgreSQL client setup using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

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

// Endpoint to handle login
app.post('/api/login', async (req, res) => {
  const { username } = req.body;

 
  try {
    let result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      result = await pool.query('INSERT INTO users (username) VALUES ($1) RETURNING *', [username]);
      user = result.rows[0];
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Strict' }); // Set HTTP-only cookie, secure: false for localhost
    res.status(200).json({ message: 'Login successful', username });
  

    
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});




const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token; // Read token from cookie

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};


app.post('/api/logout', authenticateJWT, async (req, res) => {
  const { username } = req.body;
  

  try {
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'Strict' });


   
    const userSockets = Array.from(io.sockets.sockets.values()).filter(
      (s) => s.username === username
    );

    userSockets.forEach((socket) => socket.disconnect(true));

    console.log('user deleted via logout: ' + username);
    res.status(200).json({ message: 'Logout successful and user deleted' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

// Example of a protected route
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});



io.use((socket, next) => {
  const cookieHeader = socket.request.headers.cookie;
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};

  const token = cookies.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = user;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.user.username);
  console.log('Number of active sockets:', io.sockets.sockets.size);

  

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.username);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
