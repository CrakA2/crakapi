# CrakAPI

CrakAPI is a powerful API for fetching player data. 
For a GUI version, please visit [api.crak.tech](https://api.crak.in/).

## API Endpoints

Here are the available API endpoints for direct GET requests:

### Win-Loss Tracker

`https://api.crak.in/v1/wl/:region/:puuid`

This route fetches the overall win-loss data for a player. It uses the region and the unique identifier (puuid) of the player to query the database for the player's win-loss data. If the `fs=json` query parameter is provided, it returns the data in JSON format. Otherwise, it returns a string representation of the data.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.
- `w` or `l` at the end of url (optional) for only wins and losses respectively.

Expected Response:
- If `fs` is 'json', a JSON object with the win-loss data. Example: `{ "wins": 50, "losses": 30 }`
- Otherwise, a string representation of the win-loss data. Example: "Won 50 and Lost 30"

### Leaderboard

`https://api.crak.in/v1/lb/:region/:puuid`

Fetches the leaderboard data for a player.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the leaderboard data. Example: `{ "leaderboard": "data" }`
- Otherwise, a string representation of the leaderboard data.

### KDA

`https://api.crak.tech/v1/kd/:region/:puuid`

Fetches the Kill/Death/Assist ratio for a player.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the KDA ratio. Example: `{ "kda": 1.5 }`
- Otherwise, a string representation of the KDA ratio.

### Account

`https://api.crak.in/v1/account/:name/:tag`

Fetches the account data for a player.

Parameters:
- `name`: The name of the player.
- `tag`: The tag of the player.
- `fs=json` (optional): The format of the response. If 'json', the response will be in JSON format.

Expected Response:
- If `fs` is 'json', a JSON object with the account data. Example: `{ "account": "data" }`
- Otherwise, the account data for the player.

### Headshot

`https://api.crak.in/v1/headshot/:region/:puuid`

Fetches the headshot image for a player.

Parameters:
- `region`: The region of the player.
- `puuid`: The unique identifier of the player.

Expected Response:
- The headshot % of the player.


## Error Handling

In case of an error, the API will respond with a status code of 500 and a message describing the error.

## API Credits

This project utilizes the [HenrikDev API](https://app.swaggerhub.com/apis-docs/Henrik-3/HenrikDev-API/3.0.0#/). Please refer to their documentation for more information.
