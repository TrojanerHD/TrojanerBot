import {
  Collection,
  Guild,
  Message,
  MessageActionRow,
  MessageButton,
  MessageReaction,
  PartialMessageReaction,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import Settings from '../Settings';
import { EmojiEmbed, CustomRole } from './RoleChannelManager';
import RoleAssigner from './RoleAssigner';
import { GuildTextChannel } from '../messages/Command';

export default class GuildRolesManager {
  #guild: Guild;
  #rolesChannel?: GuildTextChannel;
  #newEmbed?: EmojiEmbed;
  #newEmbeds?: EmojiEmbed[];
  #message?: Message;

  constructor(guild: Guild) {
    this.#guild = guild;
  }

  checkRolesChannel(
    rolesChannel: GuildTextChannel,
    newEmbeds: EmojiEmbed[]
  ): void {
    this.#newEmbeds = newEmbeds;
    this.#rolesChannel = rolesChannel;
    this.#rolesChannel.messages
      .fetch({ limit: 10 })
      .then(this.messagesFetched.bind(this))
      .catch(console.error);
  }

  private messagesFetched(messages: Collection<Snowflake, Message>): void {
    const rolesMessages: Message[] = messages.toJSON();
    for (let i = 0; i < this.#newEmbeds!.length; i++) {
      this.#newEmbed = this.#newEmbeds![i];
      if (!rolesMessages[i]) {
        DiscordClient.send(
          this.#rolesChannel,
          {
            embeds: [this.#newEmbed!.embed],
            components: [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId('select')
                  .setLabel('Select your roles')
                  .setStyle('PRIMARY')
              ),
            ],
          },
          //this.reactToMessage.bind(this)
        );
        continue;
      }
      while (
        !!rolesMessages[i] &&
        rolesMessages[i].author.id !== DiscordClient._client.user!.id
      )
        i++;
      rolesMessages[i]
        .edit({ embeds: [this.#newEmbed!.embed] })
        .catch(console.error)
        .then((message: void | Message) => {
          if (!(message instanceof Message)) return;
          const wrongEmojis: MessageReaction[] = message.reactions.cache
            .filter(
              (reaction: MessageReaction) =>
                !Settings.getSettings().roles.find(
                  (role: CustomRole) =>
                    role.emoji === reaction.emoji.id ||
                    role.emoji === reaction.emoji.name
                )
            )
            .toJSON();
          for (const wrongEmoji of wrongEmojis)
            message.reactions
              .resolve(wrongEmoji)
              ?.remove()
              .catch(console.error);

          this.reactToMessage(message);
        });
    }
  }

  private reactToMessage(message: void | Message): void {
    if (!(message instanceof Message)) return;
    this.messageListener(message);
    for (const emoji of this.#newEmbed!.usedEmoji) {
      if (this.#guild!.emojis.cache.toJSON().length === 0) return;
      message.react(emoji).catch(console.error);
    }
  }

  private messageListener(message: Message): void {
    this.#message = message;
    DiscordClient._client.on('messageReactionAdd', this.checkRoles.bind(this));
    DiscordClient._client.on(
      'messageReactionRemove',
      this.checkRoles.bind(this)
    );
  }

  checkRoles(r: MessageReaction | PartialMessageReaction): void {
    if (
      r.message.id !== this.#message!.id ||
      r.message.author!.id !== DiscordClient._client.user!.id ||
      r.message.guild!.id !== this.#message!.guild!.id
    )
      return;
    const roleAssigner: RoleAssigner = new RoleAssigner(r, this.#guild, this);
    this.#guild!.members.fetch()
      .then(roleAssigner.membersFetched.bind(roleAssigner))
      .catch(console.error);
  }
}
