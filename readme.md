# CrakAPI

CrakAPI is a powerful API for fetching player data. 
For a GUI version, please visit [api.crak.tech](https://api.crak.tech/).

## API Endpoints

Here are the available API endpoints for direct GET requests:

### Win-Loss Tracker

`https://crakapi.cyclic.app/v1/wl/:region/:puuid`

This route fetches the overall win-loss data for a player. It uses the region and the unique identifier (puuid) of the player to query the database for the player's win-loss data. If the `fs=json` query parameter is provided, it returns the data in JSON format. Otherwise, it returns a string representation of the data.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the win-loss data. Example: `{ "wins": 50, "losses": 30 }`
- Otherwise, a string representation of the win-loss data. Example: "Won 50 and Lost 30"

### Win-Loss Session Data

`https://crakapi.cyclic.app/v1/wl/:region/:puuid/sessiondata`

This route serves an HTML file that tracks the win-loss data for a player's active OBS session. It uses the region and the unique identifier (puuid) of the player to query the database for the player's win-loss data.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.

To add this as a browser source in OBS:
1. Copy the URL with the correct region and puuid.
2. In OBS, click the '+' button under the 'Sources' box.
3. Select 'Browser' and click 'Create new'.
4. Paste the copied URL into the 'URL' field.
5. Adjust the width, height, and other settings as needed, then click 'OK'.

### Leaderboard

`https://crakapi.cyclic.app/v1/lb/:region/:puuid`

Fetches the leaderboard data for a player.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the leaderboard data. Example: `{ "leaderboard": "data" }`
- Otherwise, a string representation of the leaderboard data.

### KDA

`https://crakapi.cyclic.app/v1/kd/:region/:puuid`

Fetches the Kill/Death/Assist ratio for a player.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the KDA ratio. Example: `{ "kda": 1.5 }`
- Otherwise, a string representation of the KDA ratio.

### Account

`https://crakapi.cyclic.app/v1/account/:name/:tag`

Fetches the account data for a player.

Parameters:
- `name`: The name of the player.
- `tag`: The tag of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the account data. Example: `{ "account": "data" }`
- Otherwise, the account data for the player.

### Headshot

`https://crakapi.cyclic.app/v1/headshot/:region/:puuid`

Fetches the headshot image for a player.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.

Expected Response:
- The headshot % of the player.




## Error Handling

In case of an error, the API will respond with a status code of 500 and a message describing the error.
