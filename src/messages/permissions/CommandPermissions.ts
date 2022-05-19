import {
  ApplicationCommandPermissionData,
  Collection,
  Guild,
  Role,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../../DiscordClient';
import Settings from '../../Settings';
import { ApplicationCommandType } from '../MessageHandler';
import Authentication from './Authentication';

export default class CommandPermissions {
  #guild: Guild;

  constructor(guild: Guild) {
    this.#guild = guild;
  }

  onCommandsSet(commands: Collection<Snowflake, ApplicationCommandType>) {
    if (Settings.getSettings()['logging'] !== 'errors') {
      console.log(
        `Warning: To update the command's permissions, please authenticate the application at https://discord.com/oauth2/authorize?client_id=${DiscordClient._client.application?.id}&scope=applications.commands.permissions.update&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000`
      );
      new Authentication();
    }
  }
}
