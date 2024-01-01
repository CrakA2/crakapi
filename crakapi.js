const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const path = require('path');
const fs = require('fs');
const app = express();
const valorantdata = require('./valorantdata');

const https = require('https');
// Load the HTTPS certificates
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.crak.tech/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.crak.tech/fullchain.pem')
};

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

const SESSION_LENGTH = 3 * 60 * 60 * 1000; // 3 hours in milliseconds


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
      last_active: Date.now(),
      session_end: Date.now() + SESSION_LENGTH, // Add this line
  };

  // Create a JWT with the session data
  const token = jwt.sign(sessionData, SECRET_KEY);

  // Check if a session for the puuid already exists
  let stmt = db.prepare(`SELECT * FROM sessions WHERE puuid = ?`);
  let row = stmt.get(puuid);
  if (row) {
      // If a session exists, reset the wins and losses and update the last active timestamp
      let updateStmt = db.prepare(`UPDATE sessions SET wins = 0, losses = 0, mmr = ?, last_active = ?, session_end = ? WHERE puuid = ?`);
      let info = updateStmt.run(mmr, Date.now(), Date.now() + SESSION_LENGTH, puuid);
      // ...
  } else {
      // If no session exists, insert a new row
      let insertStmt = db.prepare(`INSERT INTO sessions(token, region, puuid, wins, losses, mmr, last_active, session_end) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`);
      let info = insertStmt.run(token, region, puuid, 0, 0, mmr, Date.now(), Date.now() + SESSION_LENGTH);
      // ...
  }

  res.json({ token });
});

let isUpdating = false;

async function updateAllActiveSessions() {
  if (isUpdating) {
    // If an update is already in progress, don't start another one
    return;
  }

  isUpdating = true;

  try {
    // Get all active sessions
    let stmt = db.prepare(`SELECT * FROM sessions WHERE session_end > ?`);
    let rows = stmt.all(Date.now());

    // Iterate over each session
    for (const row of rows) {
      const { region, puuid } = row;

      // Fetch the current MMR
      let currentMMR;
      try {
        currentMMR = await fetchMMR(region, puuid);
      } catch (err) {
        console.error(`Failed to fetch MMR for ${region}/${puuid}: ${err}`);
        continue;
      }

      // Calculate the wins and losses
      let wins = row.wins;
      let losses = row.losses;
      let session_end = row.session_end;
      if (currentMMR > row.mmr) {
        wins++;
        session_end = Date.now() + SESSION_LENGTH; // Extend the session
      } else if (currentMMR < row.mmr) {
        losses++;
        session_end = Date.now() + SESSION_LENGTH; // Extend the session
      }

      // Update the session with the new wins, losses, and MMR
      try {
        let updateStmt = db.prepare(`UPDATE sessions SET wins = ?, losses = ?, mmr = ?, session_end = ? WHERE puuid = ?`);
        let info = updateStmt.run(wins, losses, currentMMR, session_end, puuid);
      } catch (err) {
        console.error(`Failed to update session for ${puuid}: ${err}`);
      }
    }
  } finally {
    isUpdating = false;
  }
}
app.get('/v1/wl/:region/:puuid/sessiondata', (req, res) => {
    
// Run the function every minute
setInterval(updateAllActiveSessions, 60 * 1000);

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

app.get('/v1/wl/:region/:puuid/sessiondata', (req, res) => {
    const filePath = path.join(__dirname, 'session.html');
    fs.promises.access(filePath, fs.constants.F_OK)
      .then(() => {
        res.sendFile(filePath);
      })
      .catch(err => {
        console.error(`File not found: ${filePath}`);
        res.status(404).send('File not found');
      });
  });


// Create the HTTPS server
const server = https.createServer(options, app);

// Listen on port 3000
server.listen(3000, () => {
  console.log('Server is running on https://127.0.0.1:3000/');
});