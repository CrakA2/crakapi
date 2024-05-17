const axios = require('axios');
require('dotenv').config();

async function calculate_headshot_percentage(region, puuid) {
    const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/lifetime/matches/${region}/${puuid}`;
    const response = await axios.get(url);
        if (response.status === 200) {
            const data = response.data.data;
            if (data[0]) {
                const shots = data[0].stats.shots;
                const total_shots = shots.head + shots.body + shots.leg;
                const headshots = shots.head;
                const headshot_percentage = total_shots > 0 ? (headshots / total_shots) * 100 : 0;
                return `${headshot_percentage.toFixed(1)}%`;
            }
            throw new Error('No data available');
        }
        throw new Error('Error fetching data');
    }

async function get_kda(region, puuid) {
    const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/lifetime/matches/${region}/${puuid}`;
    const response = await axios.get(url);

    if (response.status === 200) {
        const data = response.data.data;
        if (data[0]) {
            const stats = data[0].stats;
            const kills = stats.kills;
            const deaths = stats.deaths;
            const assists = stats.assists;

            return `${kills}/${deaths}/${assists}`;
        }
        throw new Error('No data available');
    }
    throw new Error('Error fetching data');
}
let apLeaderboard = [];
let euLeaderboard = [];
let naLeaderboard = [];

async function get_leaderboard(region, leaderboard) {
    for (let startIndex = 0; startIndex <= 4800; startIndex += 200) {
        const url = `https://${region}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/${activeActId}?size=200&startIndex=${startIndex}&api_key=RGAPI-1821d207-33e7-44ed-8716-e2dc5a0f46d4`;
        const response = await axios.get(url);
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (response.status === 200) {
            for (let i = 0; i < response.data.players.length; i++) {
                leaderboard[startIndex + i] = response.data.players[i];
            }
        }
    }
}

async function leaderboard_rank(region, puuid) {
    let leaderboard;
    switch (region) {
        case 'ap':
            leaderboard = apLeaderboard;
            break;
        case 'eu':
            leaderboard = euLeaderboard;
            break;
        case 'na':
            leaderboard = naLeaderboard;
            break;
        default:
            throw new Error('Invalid region');
    }

    for (let player of leaderboard) {
        if (player.puuid === puuid) {
            return player.leaderboardRank;
        }
    }

    throw new Error('Player not found in leaderboard');
}

async function ranked_rating(region, puuid) {
    const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${region}/${puuid}`;
    const response = await axios.get(url);
    if (response.status === 200) {
        const data = response.data.data;
        const current_tier_patched = data.currenttierpatched;
        const ranking_in_tier = data.ranking_in_tier;
        return `${current_tier_patched} ${ranking_in_tier} RR`;
    }
    throw new Error('Error fetching data');
}


async function get_account(name, tag) {
    const url = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=RGAPI-1821d207-33e7-44ed-8716-e2dc5a0f46d4`;
    const response = await axios.get(url);
    if (response.status === 200) {
        const data = response.data;
        const puuid = data.puuid;
        const gameName = data.gameName;
        const tagLine = data.tagLine;
        return { puuid, gameName, tagLine };
    }
    throw new Error('Error fetching data');
}

let activeActId;

async function get_active_act_id() {
    const url = `https://ap.api.riotgames.com/val/content/v1/contents?locale=en-US&api_key=RGAPI-1821d207-33e7-44ed-8716-e2dc5a0f46d4`;
    const response = await axios.get(url);
    if (response.status === 200) {
        const acts = response.data.acts; 
        for (let act of acts) {
            if (act.isActive && act.type === 'act') {
                activeActId = act.id;
                return;
            }
        }
    }
    throw new Error('Error fetching data');
}

async function start_get_leaderboard_interval() {
    // Define a helper function to update all leaderboards
    async function update_all_leaderboards() {
        await get_leaderboard('ap', apLeaderboard);
        await get_leaderboard('eu', euLeaderboard);
        await get_leaderboard('na', naLeaderboard);
    }

    // Run the helper function immediately and then every 30 minutes
    await update_all_leaderboards();
    setInterval(update_all_leaderboards, 30 * 60 * 1000);
}

function start_active_act_id_interval() {
    // Run the function immediately and then every 3 hours
    get_active_act_id();
    setInterval(get_active_act_id, 3 * 60 * 60 * 1000);
}

module.exports = {
    calculate_headshot_percentage,
    ranked_rating,
    leaderboard_rank,
    get_account,
    get_kda,
    start_active_act_id_interval,
    start_get_leaderboard_interval
};

// todo
//const riotval = require('./riotval');

//riotval.start_active_act_id_interval();
//riotval.start_get_leaderboard_interval();