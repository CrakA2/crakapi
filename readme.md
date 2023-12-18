# CrakAPI

CrakAPI is a powerful API for fetching player data. 
For a GUI version, please visit [https://crakapi.cyclic.app/](https://crakapi.cyclic.app/).

## API Endpoints

Here are the available API endpoints for direct GET requests:

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

## Error Handling

In case of an error, the API will respond with a status code of 500 and a message describing the error.