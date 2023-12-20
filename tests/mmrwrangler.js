const fs = require('fs').promises;

async function changeElo() {
    // Read the file
    const data = await fs.readFile('./mmrtest.json', 'utf8');
    const jsonData = JSON.parse(data);

    // Change the value of elo
    jsonData.region1.puuid1.elo += 5;

    // Write the new data back to the file
    await fs.writeFile('./mmrtest.json', JSON.stringify(jsonData), 'utf8');
}

async function decreaseElo() {
    // Read the file
    const data = await fs.readFile('./mmrtest.json', 'utf8');
    const jsonData = JSON.parse(data);

    // Change the value of elo
    jsonData.region1.puuid1.elo -= 5;

    // Write the new data back to the file
    await fs.writeFile('./mmrtest.json', JSON.stringify(jsonData), 'utf8');
}

// Change the value of elo every 8 seconds
setInterval(changeElo, 8000);
setInterval(decreaseElo, 16000);