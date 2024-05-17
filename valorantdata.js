const axios = require("axios");
require("dotenv").config();

async function calculate_headshot_percentage(region, puuid) {
  const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/lifetime/matches/${region}/${puuid}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `${process.env.HENRIK_KEY}`,
    },
  });

  if (response.status === 200) {
    const data = response.data.data;
    if (data[0]) {
      const shots = data[0].stats.shots;
      const total_shots = shots.head + shots.body + shots.leg;
      const headshots = shots.head;
      const headshot_percentage =
        total_shots > 0 ? (headshots / total_shots) * 100 : 0;
      return `${headshot_percentage.toFixed(1)}%`;
    }
    throw new Error("No data available");
  }
  throw new Error("Error fetching data");
}

async function get_kda(region, puuid) {
  const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/lifetime/matches/${region}/${puuid}`;
    const response = await axios.get(url, {
    headers: {
      Authorization: `${process.env.HENRIK_KEY}`,
    },
  });

  if (response.status === 200) {
    const data = response.data.data;
    if (data[0]) {
      const stats = data[0].stats;
      const kills = stats.kills;
      const deaths = stats.deaths;
      const assists = stats.assists;

      return `${kills}/${deaths}/${assists}`;
    }
    throw new Error("No data available");
  }
  throw new Error("Error fetching data");
}

async function ranked_rating(region, puuid) {
  const url = `https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${region}/${puuid}`;
    const response = await axios.get(url, {
    headers: {
      Authorization: `${process.env.HENRIK_KEY}`,
    },
  });
  if (response.status === 200) {
    const data = response.data.data;
    const current_tier_patched = data.currenttierpatched;
    const ranking_in_tier = data.ranking_in_tier;
    return `${current_tier_patched} ${ranking_in_tier} RR`;
  }
  throw new Error("Error fetching data");
}

async function leaderboard_rank(region, puuid) {
  const url = `https://api.henrikdev.xyz/valorant/v2/leaderboard/${region}?puuid=${puuid}`;
    const response = await axios.get(url, {
    headers: {
      Authorization: `${process.env.HENRIK_KEY}`,
    },
  });
  if (response.status === 200) {
    const players = response.data.data;
    for (let player of players) {
      if (player.puuid === puuid) {
        return player.leaderboardRank;
      }
    }
  }
  throw new Error("Error fetching data");
}

async function get_account(name, tag) {
  const url = `https://api.henrikdev.xyz/valorant/v1/account/${name}/${tag}`;
    const response = await axios.get(url, {
    headers: {
      Authorization: `${process.env.HENRIK_KEY}`,
    },
  });
  if (response.status === 200) {
    const data = response.data.data;
    const puuid = data.puuid;
    const region = data.region;
    return { puuid, region };
  }
  throw new Error("Error fetching data");
}

module.exports = {
  calculate_headshot_percentage,
  ranked_rating,
  leaderboard_rank,
  get_account,
  get_kda,
};
