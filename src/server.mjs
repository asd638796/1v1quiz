import dotenvx from '@dotenvx/dotenvx';
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
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

const activeUsers = {}; // Map username to Set of socket IDs
const disconnectTimeouts = {}; // Map username to timeout IDs


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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Check if the user has any questions, if not insert default questions
    const questionsCheck = await pool.query('SELECT * FROM questions WHERE username = $1', [username]);
    if (questionsCheck.rows.length === 0) {
      
      const questionsPath = path.join(__dirname, '../public/default.json');
      const defaultQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

      const insertQuery = 'INSERT INTO questions (username, country, capital) VALUES ($1, $2, $3)';
      for (const question of defaultQuestions) {
        await pool.query(insertQuery, [username, question.country, question.capital]);
      }
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


app.post('/api/save-questions', authenticateJWT, async (req, res) => {
  const { username, questions } = req.body;

  try {
    // Start a transaction to ensure atomicity
    await pool.query('BEGIN');

    // Delete existing questions for the user
    const deleteQuery = 'DELETE FROM questions WHERE username = $1';
    await pool.query(deleteQuery, [username]);

    // Insert the new questions into the questions table
    const insertQuery = 'INSERT INTO questions (username, country, capital) VALUES ($1, $2, $3)';
    for (const question of questions) {
      await pool.query(insertQuery, [username, question.country, question.capital]);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    res.status(200).json({ message: 'Questions saved successfully' });
  } catch (error) {
    // Rollback the transaction in case of an error
    await pool.query('ROLLBACK');
    console.error('Error saving questions:', error);
    res.status(500).json({ error: 'Failed to save questions' });
  }
});


app.get('/api/get-questions', authenticateJWT, async (req, res) => {
  const { username } = req.query;

  try {
    // Retrieve the questions for this user
    const questions = await pool.query('SELECT country, capital FROM questions WHERE username = $1', [username]);
    
    res.status(200).json(questions.rows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});


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

app.get('/api/get-user', authenticateJWT, (req, res) => {

  if (req.user) {
    res.status(200).json({ username: req.user.username });
    
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});


app.post('/api/logout', authenticateJWT, async (req, res) => {
  const { username } = req.body;
  
  
  


  try {
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    await pool.query('DELETE FROM questions WHERE username = $1', [username]);
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'Strict' });


   
    if (activeUsers[username]) {
      activeUsers[username].forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });

      if (disconnectTimeouts[username]) {
        clearTimeout(disconnectTimeouts[username]);
        delete disconnectTimeouts[username];
      }
    

      // Remove the user's entry from activeUsers
      delete activeUsers[username];
    }
    console.log('user deleted via logout: ' + username);
    res.status(200).json({ message: 'Logout successful and user deleted' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

app.get('/api/game-state', authenticateJWT, (req, res) => {
  const { room } = req.query;

  // Check if the game exists for the given room
  if (games[room]) {
    const gameState = {
      timers: games[room].timers,
      isPlayerTurn: games[room].isPlayerTurn,
      question: games[room].question,
      players: games[room].players,
    };
    res.status(200).json(gameState);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
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

  console.log(games);

  if (disconnectTimeouts[username]) {
    clearTimeout(disconnectTimeouts[username]);
    delete disconnectTimeouts[username];
  }

  if (!activeUsers[username]) {
    activeUsers[username] = new Set();
  }
  activeUsers[username].add(socket.id);

  console.log(activeUsers);
  
  socket.on('join_room', ({ room, username }) => {
    socket.join(room);

    

    console.log(`${username} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    
    
    
    if (activeUsers[username]) {
      activeUsers[username].delete(socket.id);

      // If the user has no more active sockets, start the timeout
      if (activeUsers[username].size === 0) {
        disconnectTimeouts[username] = setTimeout(async () => {

          
          try {
            // Perform cleanup logic
            await pool.query('DELETE FROM users WHERE username = $1', [username]);
            await pool.query('DELETE FROM questions WHERE username = $1', [username]);

            // Remove user from activeUsers
            delete activeUsers[username];
            delete disconnectTimeouts[username];

            // Notify other players or clean up game state if necessary
            // For example, if the user was in a game, end the game or declare the opponent as the winner

            console.log(`User ${username} deleted after disconnect timeout.`);
          } catch (error) {
            console.error('Error during disconnect cleanup:', error);
          }
        }, 10000); // 10-second timeout
      }
    }
  });

  socket.on('send_invitation', ({ from, to }) => {
    const recipientSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.username === to
    );
    if (recipientSocket) {
      recipientSocket.emit('receive_invitation', { from });
    }
  });

  socket.on('accept_invitation', async ({ from, to }) => {
    const sortedUsernames = [from, to].sort();
    const room = `${sortedUsernames[0]}-${sortedUsernames[1]}`;
  

    const fromSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.username === from
    );
    const toSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.username === to
    );

    if (fromSocket && toSocket) {
      

      fromSocket.emit('invitation_accepted', { to });
      toSocket.emit('invitation_accepted', { from });

      // Fetch questions directly from the database
      const result = await pool.query('SELECT country, capital FROM questions WHERE username = $1', [username]);
      const questions = result.rows;  
      const initialQuestion = questions[Math.floor(Math.random() * questions.length)];

      // Initialize game state
      games[room] = {
        timers: {
          [from]: 30, // Timer for 'from' player
          [to]: 30,   // Timer for 'to' player
        },
        isPlayerTurn: from,  // Start with 'from' player
        players: { from, to }, 
        question: initialQuestion,
        questions: questions
      };

    

      // Send start_game event to the correct users
      fromSocket.emit('start_game', { room });
      toSocket.emit('start_game', { room });

      startGameTimer(room);
    }
  });

  const startGameTimer = async (room) => {
    try {
      if (games[room]) {
        const { players, timers } = games[room];  // Ensure that players and timers exist
        const from = players.from;
        const to = players.to;
        
        // Start the timer logic...
        const interval = setInterval(() => {
          if (!games[room]) {
            clearInterval(interval);
            return;
          }
  
          if (timers[from] <= 0 || timers[to] <= 0) {
            clearInterval(interval);
            const winner = timers[from] > 0 ? from : to;
            const loser = timers[from] <= 0 ? from : to;
            io.to(room).emit('game_over', { winner, loser });
            delete games[room];
          } else {
            if (games[room].isPlayerTurn === from) {
              timers[from] -= 1;
            } else {
              timers[to] -= 1;
            }
            
            console.log(games[room]);
            io.to(room).emit('timer_update', {
              timers: games[room].timers,
            });
          }
        }, 1000);
      } else {
        console.error('Game state not initialized');
      }
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  
  socket.on('accept_invitation', async ({ from, to }) => {
    const sortedUsernames = [from, to].sort();
    const room = `${sortedUsernames[0]}-${sortedUsernames[1]}`;
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
  
      // Initialize the game and start the timer
      await startGameTimer(room, from);
    }
  });

  
  socket.on('next_turn', ({ room }) => {
    if (!games[room]) {
      return;
    }
    
    
    // Toggle the turn
    const currentTurn = games[room].isPlayerTurn;
    const nextTurn = currentTurn === games[room].players.from ? games[room].players.to : games[room].players.from;
  
    // Pick a new random question from the stored list
    const newQuestion = games[room].questions[Math.floor(Math.random() * games[room].questions.length)];
  
    // Update the game state
    games[room].isPlayerTurn = nextTurn;
    games[room].question = newQuestion;
  
    // Emit the updated turn and question to all clients in the room
    io.to(room).emit('next_turn', { question: newQuestion, isPlayerTurn: nextTurn });
  });

    socket.on('skip_turn', ({ room }) => {
      if (!games[room]) {
        return;
      }
      
      const { players, timers } = games[room];  // Ensure that players and timers exist
        const from = players.from;
        const to = players.to;

      
      // Decrease the player's time by 1 second
      const currentTurn = games[room].isPlayerTurn;
      if (currentTurn === from) {
        timers[from] -= 2;
        if (timers[from] < 0) timers[from] = 0;
      } else {
        timers[to] -= 2;
        if (timers[to] < 0) timers[to] = 0;
      }

      io.to(room).emit('timer_update', {
        timers: timers
        
      });
    
    
    
      // Toggle the turn
      const nextTurn = currentTurn === from ? to : from;
    
      games[room].isPlayerTurn = nextTurn;
    
      // Fetch the next question for the next player
      const newQuestion = games[room].questions[Math.floor(Math.random() * games[room].questions.length)];

      games[room].question = newQuestion;
      
      

      // Emit the updated game state to all clients in the room
      io.to(room).emit('next_turn', { question: newQuestion, isPlayerTurn: nextTurn });
    
      
  });

  socket.on('game_over', ({ room, winner, loser }) => {
    io.to(room).emit('game_over', { winner, loser });
    io.in(room).socketsLeave(room);
    delete games[room];
  });

});



server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
