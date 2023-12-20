const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const path = require('path');
const fs = require('fs');
const app = express();
const valorantdata = require('./valorantdata');


const SECRET_KEY = 'unbgaq';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
const url = require('url');

const rateLimit = require('express-rate-limit');

// Configure rate limiter for puuid with 10 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // 30 requests allowed per window
  keyGenerator: (req) => {
    // Parse the URL and extract the path
    const parsedUrl = url.parse(req.url);
    const pathParts = parsedUrl.pathname.split('/');
    const puuid = pathParts[pathParts.length - 1];
    return puuid;
  },
});


app.use(limiter);

// Import better-sqlite3
const Database = require('better-sqlite3');

// Initialize SQLite database
let db = new Database('./sessions.db');

console.log('Connected to the sessions database.');

// Create table if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  region TEXT,
  puuid TEXT,
  wins INTEGER,
  losses INTEGER,
  mmr INTEGER,
  last_active INTEGER
)`);

app.get('/v1/hs/:region/:puuid', async (req, res) => {
    try {
        const region = req.params.region;
        const puuid = req.params.puuid;
        const fs = req.query.fs;
        const hs = await valorantdata.calculate_headshot_percentage(region, puuid);

        if (fs === 'json') {
            res.json({ hs: hs });
        } else {
            res.send(hs.toString());
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/v1/rr/:region/:puuid', async (req, res) => {
    try {
        const region = req.params.region;
        const puuid = req.params.puuid;
        const fs = req.query.fs;
        const rr = await valorantdata.ranked_rating(region, puuid);

        if (fs === 'json') {
            res.json({ rr: rr });
        } else {
            res.send(rr.toString());
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/v1/lb/:region/:puuid', async (req, res) => {
    try {
        const region = req.params.region;
        const puuid = req.params.puuid;
        const fs = req.query.fs;
        const lb = await valorantdata.leaderboard_rank(region, puuid);

        if (fs === 'json') {
            res.json({ lb: lb });
        } else {
            res.send(lb.toString());
        }
    } catch (error) {
        res.status(500).send('Player not found in leaderboard');
    }
});

app.get('/v1/kd/:region/:puuid', async (req, res) => {
    try {
        const region = req.params.region;
        const puuid = req.params.puuid;
        const fs = req.query.fs;
        const kda = await valorantdata.get_kda(region, puuid);

        if (fs === 'json') {
            res.json({ kda: kda });
        } else {
            res.send(kda.toString());
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/v1/account/:name/:tag', async (req, res) => {
    try {
        const name = req.params.name;
        const tag = req.params.tag;
        const fs = req.query.fs;
        const account = await valorantdata.get_account(name, tag);

        if (fs === 'json') {
            res.json({ account: account });
        } else {
            res.send(account.toString());
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

async function fetchMMR(region, puuid) {
    const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${region}/${puuid}`;

    try {
        const response = await axios.get(url);

        if (response.status === 200) {
            const mmrCurrent = response.data.data.elo;
            console.log(`MMR Current: ${mmrCurrent}`);
            return mmrCurrent;
        } else {
            console.error(`Error fetching data. Status code: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

app.post('/v1/wl/:region/:puuid/start', async (req, res) => {
  const { region, puuid } = req.params;

  // Fetch the initial MMR
  const mmr = await fetchMMR(region, puuid);

  // Start a new session for the user
  const sessionData = {
      region,
      puuid,
      wins: 0,
      losses: 0,
      mmr,
      last_active: Date.now(), // Add this line
  };

  // Create a JWT with the session data
  const token = jwt.sign(sessionData, SECRET_KEY);

  // Check if a session for the puuid already exists
  let stmt = db.prepare(`SELECT * FROM sessions WHERE puuid = ?`);
  let row = stmt.get(puuid);
  if (row) {
      // If a session exists, reset the wins and losses and update the last active timestamp
      let updateStmt = db.prepare(`UPDATE sessions SET wins = 0, losses = 0, mmr = ?, last_active = ? WHERE puuid = ?`);
      let info = updateStmt.run(mmr, Date.now(), puuid);
      if (info.changes === 0) {
          console.log(`No session found for puuid ${puuid}`);
      } else {
          console.log(`Session for puuid ${puuid} has been reset`);
      }
  } else {
      // If no session exists, insert a new row
      let insertStmt = db.prepare(`INSERT INTO sessions(token, region, puuid, wins, losses, mmr, last_active) VALUES(?, ?, ?, ?, ?, ?, ?)`);
      let info = insertStmt.run(token, region, puuid, 0, 0, mmr, Date.now());
      console.log(`A row has been inserted with rowid ${info.lastInsertRowid}`);
  }

  res.json({ token });
});



app.get('/v1/wl/:region/:puuid/sessiondata', (req, res) => {
  const filePath = path.join(__dirname, 'session.html');
  fsPromises.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
          console.error(`File not found: ${filePath}`);
          res.status(404).send('File not found');
      } else {
          res.sendFile(filePath);
      }
  });
});

app.post('/v1/wl/:region/:puuid/update', async (req, res) => {
  const { region, puuid } = req.params;

  // Fetch the current MMR
  const currentMMR = await fetchMMR(region, puuid);

  // Get the session for the user
  let stmt = db.prepare(`SELECT * FROM sessions WHERE puuid = ?`);
  let row = stmt.get(puuid);
  if (row) {
      // If a session exists, calculate the wins and losses
      let wins = row.wins;
      let losses = row.losses;
      if (currentMMR > row.mmr) {
          wins++;
      } else if (currentMMR < row.mmr) {
          losses++;
      }

      // Update the session with the new wins, losses, and MMR
      let updateStmt = db.prepare(`UPDATE sessions SET wins = ?, losses = ?, mmr = ? WHERE puuid = ?`);
      let info = updateStmt.run(wins, losses, currentMMR, puuid);
      if (info.changes === 0) {
          console.log(`No session found for puuid ${puuid}`);
      } else {
          console.log(`Session for puuid ${puuid} has been updated`);
      }
  } else {
      console.log(`No session found for puuid ${puuid}`);
      res.status(404).send('No session found for this puuid');
  }
});

app.post('/v1/wl/:region/:puuid/keepalive', (req, res) => {
  const { region, puuid } = req.params;
  const { token } = req.body;

  // Validate the token and find the session
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
          res.status(401).send('Invalid token');
          return;
      }

      // Update the "last active" timestamp for the session
      const lastActive = Date.now();
      db.run(
          `UPDATE sessions SET last_active = ? WHERE puuid = ? AND region = ?`,
          [lastActive, puuid, region],
          function (err) {
              if (err) {
                  console.log(err.message);
                  res.status(500).send('Failed to update session');
                  return;
              }

              if (this.changes === 0) {
                  res.status(404).send('Session not found');
                  return;
              }

              res.sendStatus(200);
          }
      );
  });
});

app.get('/v1/wl/:region/:puuid', (req, res) => {
  const { region, puuid } = req.params;
  const format = req.query.fs;

  // Get the session for the user
  let stmt = db.prepare(`SELECT * FROM sessions WHERE puuid = ?`);
  let row = stmt.get(puuid);
  if (row) {
      // If a session exists, send the wins and losses
      if (format === 'json') {
          res.json({ wins: row.wins, losses: row.losses });
      } else {
          res.send(`Wins: ${row.wins}, Losses: ${row.losses}`);
      }
  } else {
      res.status(404).send('No session found for this puuid');
  }
});
  
  app.listen(3000, () => {
    console.log('Server is running on http://127.0.0.1:3000/');
  });