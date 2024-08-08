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

let games = {};



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

app.get('/api/search-users', authenticateJWT, async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query('SELECT id, username FROM users WHERE username ILIKE $1', [`%${query}%`]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error searching for users:', error);
    res.status(500).json({ error: 'Failed to search for users' });
  }
});


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
  const username = socket.user.username;

  socket.on('send_invitation', ({ from, to }) => {
    const recipientSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.username === to
    );
    if (recipientSocket) {
      recipientSocket.emit('receive_invitation', { from });
    }
  });

  socket.on('accept_invitation', ({ from, to }) => {
    const room = `${from}-${to}`;
    socket.join(room);

    const fromSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.username === from
    );
    const toSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.username === to
    );

    if (fromSocket && toSocket) {
      fromSocket.join(room);
      toSocket.join(room);

      fromSocket.emit('invitation_accepted', { to });
      toSocket.emit('invitation_accepted', { from });

      // Initialize game state
      games[room] = { playerTime: 30, opponentTime: 30, isPlayerTurn: true, players: { from, to } };

      // Send start_game event to the correct users
      fromSocket.emit('start_game', { firstTurn: true, opponent: to });
      toSocket.emit('start_game', { firstTurn: false, opponent: from });

      startGameTimer(room);
    }
  });

  const startGameTimer = (room) => {
    const interval = setInterval(() => {
      if (!games[room]) {
        clearInterval(interval);
        return;
      }

      if (games[room].playerTime <= 0 || games[room].opponentTime <= 0) {
        clearInterval(interval);
        const winner = games[room].playerTime > 0 ? games[room].players.from : games[room].players.to;
        const loser = games[room].playerTime <= 0 ? games[room].players.from : games[room].players.to;
        io.to(room).emit('game_over', { winner, loser });
        delete games[room];
      } else {
        if (games[room].isPlayerTurn) {
          games[room].playerTime -= 1;
        } else {
          games[room].opponentTime -= 1;
        }

        const fromSocket = [...io.sockets.sockets.values()].find(
          (s) => s.user.username === games[room].players.from
        );
        const toSocket = [...io.sockets.sockets.values()].find(
          (s) => s.user.username === games[room].players.to
        );

        if (fromSocket && toSocket) {
          fromSocket.emit('timer_update', { myTime: games[room].playerTime, opponentTime: games[room].opponentTime });
          toSocket.emit('timer_update', { myTime: games[room].opponentTime, opponentTime: games[room].playerTime });
        }
      }
    }, 1000);
  };

  socket.on('next_turn', ({ question, room }) => {
    if (!games[room]) {
      return;
    }
    games[room].isPlayerTurn = !games[room].isPlayerTurn;
    io.to(room).emit('next_turn', { question });
  });

  socket.on('game_over', ({ room, winner, loser }) => {
    io.to(room).emit('game_over', { winner, loser });
    delete games[room];
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
