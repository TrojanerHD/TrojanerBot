# Trojaner Bot
This is a [Discord](https://discord.com) bot currently only running on my [Discord server](https://discord.gg/NdsmmwV). There is no official way of adding this bot to your own Discord server.

## Deployment and contribution
### Prerequisites
+ Git
+ Node.js
+ Yarn (or npm)

### Deployment
```sh
git clone https://github.com/TrojanerHD/TrojanerBot&& \
cd TrojanerBot && yarn
```
The next step is to create several files:
+ `./.env` with the content
```
DISCORD_TOKEN=<DISCORD_TOKEN>
TWITCH_TOKEN=<TWITCH_TOKEN>
```
Where `<DISCORD_TOKEN>` is the Discord token of your bot account at the [Discord Developer Portal](https://discord.com/developers/applications) and `<TWITCH_TOKEN>` is your client secret generated after you create an application in the [Twitch Developer Console](https://dev.twitch.tv/console/apps)
+ `./streamers-command.json` with the content `[]`
+ `./twitch-id.json` with the content `"<TWITCH_ID>"` which you can also get from the Twitch Dev Console
+ `src/streamers-live-channel.json` with the content
```json
[
    "name",
    "name2",
    "…"
]
```
where you can add names of live streamers on Twitch that will be shown in a `#live` channel in Discord if the Discord has this channel. If you do not want to use this feature just insert `[]`.

### Execution
```sh
tsc -p .
node -r dotenv/config $PWD/build/src/index.js
```