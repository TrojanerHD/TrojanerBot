import {
  ApplicationCommandManager,
  Collection,
  Guild,
  GuildApplicationCommandManager,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from './Command';
import { ApplicationCommandType } from './MessageHandler';

export default class RegisterCommand {
  #command: Command;
  #guild?: Guild;

  constructor(command: Command, guild?: Guild) {
    this.#command = command;
    this.#guild = guild;
  }

  addCommand(commands: Collection<Snowflake, ApplicationCommandType>): void {
    const commandHandler:
      | ApplicationCommandManager
      | GuildApplicationCommandManager
      | undefined = !this.#guild
      ? DiscordClient._client.application?.commands
      : this.#guild.commands;
    const existingCommand: ApplicationCommandType | undefined = commands
      .array()
      .find(
        (value: ApplicationCommandType) =>
          value.name === this.#command.deploy.name
      );
    if (!existingCommand)
      commandHandler!.create(this.#command.deploy).catch(console.error);
    else
      commandHandler!
        .edit(existingCommand, this.#command.deploy)
        .catch(console.error);
  }
}
