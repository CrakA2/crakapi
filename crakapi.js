const express = require('express');
const cors = require('cors');

const app = express();
const valorantdata = require('./valorantdata');

app.use(cors());
app.use(express.static('public'));

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

app.listen(3000, () => {
    console.log('Server is running on http://127.0.0.1:3000/v1');
});