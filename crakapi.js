const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const path = require('path');
const fs = require('fs');
const app = express();
const valorantdata = require('./valorantdata');

const https = require('https');

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
app.get('/', (req, res) => {
  res.sendFile(path.join('./public', 'index.html'));
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

const Database = require('better-sqlite3');
const http = require('http');
let db = new Database('user_data.db');
let isUpdating = false;

db.exec(`
  CREATE TABLE IF NOT EXISTS user_reset_time (
    puuid TEXT PRIMARY KEY,
    region TEXT,
    reset_time INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_mmr (
    puuid TEXT PRIMARY KEY,
    mmr INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
  );
`);

async function updateAllActiveSessions() {
  if (isUpdating) {
    return;
  }

  isUpdating = true;

  try {
    let stmt = db.prepare(`SELECT * FROM user_reset_time`);
    let rows = stmt.all();

    for (const row of rows) {
      const { region, puuid, reset_time } = row;

      if (Date.now() >= reset_time) {
        try {
          let mmrStmt = db.prepare(`SELECT mmr FROM user_mmr WHERE puuid = ?`);
          let mmrRow = mmrStmt.get(puuid);

          const currentMMR = await fetchMMR(region, puuid);

          if (mmrRow) {
            if (currentMMR > mmrRow.mmr) {
              db.prepare(`UPDATE user_mmr SET wins = wins + 1, mmr = ? WHERE puuid = ?`).run(currentMMR, puuid);
            } else if (currentMMR < mmrRow.mmr) {
              db.prepare(`UPDATE user_mmr SET losses = losses + 1, mmr = ? WHERE puuid = ?`).run(currentMMR, puuid);
            }
          } else {
            db.prepare(`INSERT INTO user_mmr (puuid, mmr) VALUES (?, ?)`).run(puuid, currentMMR);
          }

          db.prepare(`UPDATE user_reset_time SET reset_time = ? WHERE puuid = ?`).run(Date.now() + 24 * 60 * 60 * 1000, puuid);
        } catch (err) {
          console.error(`Failed to update MMR and reset time for ${puuid}: ${err}`);
        }
      }
    }
  } finally {
    isUpdating = false;
  }
}

setInterval(updateAllActiveSessions, 60 * 1000);

app.get('/v1/wl/:region/:puuid', (req, res) => {
  const { region, puuid } = req.params;
  const { reset_time, fs } = req.query;

  let stmt = db.prepare(`SELECT * FROM user_reset_time WHERE puuid = ?`);
  let row = stmt.get(puuid);

  if (row) {
    if (reset_time) {
      let updateStmt = db.prepare(`UPDATE user_reset_time SET reset_time = ? WHERE puuid = ?`);
      let info = updateStmt.run(reset_time, puuid);
    }
  } else {
    let insertStmt = db.prepare(`INSERT INTO user_reset_time (puuid, region, reset_time) VALUES (?, ?, ?)`);
    let info = insertStmt.run(puuid, region, reset_time || Date.now());
  }

  stmt = db.prepare(`SELECT * FROM user_mmr WHERE puuid = ?`);
  row = stmt.get(puuid);

  if (row) {
    if (fs === 'json') {
      res.json({ wins: row.wins, losses: row.losses });
    } else {
      res.send(`Has won ${row.wins} and lost ${row.losses}`);
    }
  } else {
    res.status(404).send('No user found for this puuid');
  }
});
app.patch('/v1/wl/:region/:puuid/reset_time', (req, res) => {
  const { region, puuid } = req.params;
  if (!region || !puuid) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    let stmt = db.prepare(`SELECT * FROM user_reset_time WHERE puuid = ?`);
    let row = stmt.get(puuid);

    if (row) {
      let currentTime = new Date();
      let resetTime = new Date(row.reset_time);

      if (resetTime < currentTime) {
        resetTime.setHours(resetTime.getHours() + 24);
        let updateStmt = db.prepare(`UPDATE user_reset_time SET reset_time = ? WHERE puuid = ?`);
        updateStmt.run(resetTime.toISOString(), puuid);
      }

      res.json({ message: 'Wins and losses reset successfully' });
    } else {
      res.status(404).json({ message: 'No user found for this puuid' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while resetting wins and losses' });
  }
});
app.get('/v1/wl/:region/:puuid/reset_time', (req, res) => {
  const { region, puuid } = req.params;
  if (!region || !puuid) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    let stmt = db.prepare(`SELECT * FROM user_reset_time WHERE puuid = ?`);
    let row = stmt.get(puuid);

    if (row) {
      res.json({ message: `Current reset time: ${row.reset_time}` });
    } else {
      let currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 24); 
      let insertStmt = db.prepare(`INSERT INTO user_reset_time (puuid, reset_time) VALUES (?, ?)`);
      insertStmt.run(puuid, currentTime.toISOString());

      res.json({ message: `New user added, reset time: ${currentTime.toISOString()}` });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while retrieving the reset time' });
  }
});
app.get('/v1/wl/:region/:puuid/w', (req, res) => {
  const { puuid } = req.params;

  let stmt = db.prepare(`SELECT wins FROM user_mmr WHERE puuid = ?`);
  let row = stmt.get(puuid);

  if (row) {
    res.json({ wins: row.wins });
  } else {
    res.status(404).json({ message: 'No user found for this puuid' });
  }
});

app.get('/v1/wl/:region/:puuid/l', (req, res) => {
  const { puuid } = req.params;

  let stmt = db.prepare(`SELECT losses FROM user_mmr WHERE puuid = ?`);
  let row = stmt.get(puuid);

  if (row) {
    res.json({ losses: row.losses });
  } else {
    res.status(404).json({ message: 'No user found for this puuid' });
  }
});
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.crak.tech/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.crak.tech/fullchain.pem')
};

const server = https.createServer(options, app);

// Listen on port 3000
server.listen(3000, () => {
  console.log('Server is running on https://127.0.0.1:3000/');
});