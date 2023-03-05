# Trojaner Bot
This is a [Discord](https://discord.com) bot currently only running on my [Discord server](https://discord.gg/NdsmmwV). To add this bot on your server, use the following link: 

## Adding the bot to your server
1. Click the following link: https://discord.com/api/oauth2/authorize?client_id=632637013475983360&permissions=8&scope=bot%20applications.commands
   - Note that the bot is added with admin privileges. You may alter the permissions value but keep in mind that some features might not work or lead to unexpected behavior
2. (Optional) Set up the following text-channels
	 - `#live` for a nice embed showing people selected by you who are currently live on Twitch
	 - `#roles` for a customizable role management
3. (Optional) Set up the bot using the following admin commands:
   - `/permit <add|remove> <role>` adds/removes `<role>` as permitted. Every user with that role can execute privileged commands.
	- `/stream-channel <add|remove|list> …` adds Twitch streamers to show in a `#live` channel. If a channel called `#live` does not exist, this does not work
	- `/roles <add|remove> <role> …` adds/removes roles for the role manager (channel `#roles` is required)

## Deployment and contribution
### Requirements
+ Git
+ Node.js
+ Yarn (or npm)
+ Basic knowledge of TypeScript types and JSON

### Deployment
```sh
git clone https://github.com/TrojanerHD/TrojanerBot&& \
cd TrojanerBot && yarn
```
Next up you want to create a file: `./.env` with the content
```
DISCORD_TOKEN=<DISCORD_TOKEN>
TWITCH_TOKEN=<TWITCH_TOKEN> (optional)
OAUTH_TOKEN=<OAUTH_TOKEN>
```
Where you replace…
- `<DISCORD_TOKEN>` with the Discord token of your bot account at the [Discord Developer Portal](https://discord.com/developers/applications)
- `<TWITCH_TOKEN> (optional)` with your client secret generated after you create an application in the [Twitch Developer Console](https://dev.twitch.tv/console/apps) which is only required if you want to use the Twitch features of this bot
- `<OAUTH_TOKEN>` with the OAuth token you get from your application's OAuth page (`https://discord.com/developers/applications/{YOUR_APP_ID}/oauth2/general` → Client Secret)

Execute the bot as described in [Execution](https://github.com/TrojanerHD/TrojanerBot/#Execution). It will generate a `settings.json` file in the bot directory and will already work. You can, however, modify the content of `settings.json` (you need to restart the bot if you added a Twitch ID):
#### Settings
In this step I will go over all properties of the `settings.json` file:

Key | Type | Description | Default
--- | --- | --- | ---
`twitch-id` | string | The ID of your Twitch application found in the [Twitch Developer Console](https://dev.twitch.tv/console/apps). If you do not want to use the Twitch features of this bot, set the value to `""` | `""`
`streamer-subscriptions` | {streamer: string; subscribers: string[]} | The bot will store all subscriptions to Twitch streamers when somebody uses `/streamer` to subscribe to a streamer. Usually you want to leave it as it is | `[]`
`logging` | "errors" \| "warnings" \| "verbose" | The log-level. "warnings" will inform if, for example, twitch id was set but a token was not provided | `"warnings"`
`express-port` | number \| undefined | The port the express app will listen on | `undefined`
`proxy` | {host: string; port: number} | If the express server is put behind a proxy (e. g. a reverse proxy), set the host and port of the proxy here | `undefined`

### Execution
```sh
tsc -p .
node $PWD/build/src/index.js
```