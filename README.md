# Trojaner Bot
This is a [Discord](https://discord.com) bot currently only running on my [Discord server](https://discord.gg/NdsmmwV). There is no official way of adding this bot to your own Discord server.

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

Execute the bot as described in [Execution](https://github.com/TrojanerHD/TrojanerBot/#Execution). It will generate a `settings.json` file in the bot directory and will already work. You can, however, modify the content of `settings.json` (you need to restart the bot if you added a Twitch ID or roles):
#### Settings
In this step I will go over all properties of the `settings.json` file:

Key | Type | Description | Default
--- | --- | --- | ---
`twitch-id` | string | The ID of your Twitch application found in the [Twitch Developer Console](https://dev.twitch.tv/console/apps). If you do not want to use the Twitch features of this bot, set the value to `""` | `""`
`permission-roles` | string[] | Added roles will be able to execute commands that require permissions (e. g. /bye) | `[]`
`roles` | {name: string; emoji: string; description?: string}[] | Added roles will be displayed in a `#roles` channel in Discord if the Discord has this channel. The emoji id will be used as reaction emoji so when a user reacts with the certain emoji they will get the role respectively. If you do not want to use this feature, set the value to `[]` | `[]`
`streamers` | string[] | The bot will show whenever the here specified channels are live in a `#live` channel in Discord if the Discord has this channel. If you do not want to use this feature, set the value to `[]` | `[]`
`streamer-subscriptions` | {streamer: string; subscribers: string[]} | The bot will store all subscriptions to Twitch streamers when somebody uses `/streamer` to subscribe to a streamer. Usually you want to leave it as it is | `[]`
`logging` | "errors" \| "warnings" \| "verbose" | The log-level. "warnings" will inform if, for example, twitch id was set but a token was not provided | `"warnings"`
`express-port` | number \| undefined | The port the express app will listen on | `undefined`

### Execution
```sh
tsc -p .
node $PWD/build/src/index.js
```