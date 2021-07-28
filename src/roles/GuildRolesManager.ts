import {
  Collection,
  Guild,
  Message,
  MessageReaction,
  ReactionCollector,
  Snowflake,
  TextChannel,
} from 'discord.js';
import { DiscordClient } from '../DiscordClient';
import Settings from '../Settings';
import { EmojiEmbed, CustomRole } from './RoleChannelManager';
import RoleAssigner from './RoleAssigner';

export default class GuildRolesManager {
  #guild: Guild;
  #rolesChannel?: TextChannel;
  #newEmbed?: EmojiEmbed;
  #newEmbeds?: EmojiEmbed[];

  constructor(guild: Guild) {
    this.#guild = guild;
  }

  checkRolesChannel(rolesChannel: TextChannel, newEmbeds: EmojiEmbed[]): void {
    this.#newEmbeds = newEmbeds;
    this.#rolesChannel = rolesChannel;
    this.#rolesChannel.messages
      .fetch({ limit: 10 })
      .then(this.messagesFetched.bind(this))
      .catch(console.error);
  }

  private messagesFetched(messages: Collection<Snowflake, Message>): void {
    const rolesMessages = messages.array();
    for (let i = 0; i < this.#newEmbeds!.length; i++) {
      this.#newEmbed = this.#newEmbeds![i];
      if (!rolesMessages[i]) {
        this.#rolesChannel!.send(this.#newEmbed!.embed)
          .catch(console.error)
          .then(this.reactToMessage.bind(this));
        continue;
      }
      while (
        !!rolesMessages[i] &&
        rolesMessages[i].author.id !== DiscordClient._client.user!.id
      )
        i++;
      rolesMessages[i]
        .edit(this.#newEmbed!.embed)
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
            .array();
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
      if (this.#guild!.emojis.cache.array().length === 0) return;
      message.react(emoji).catch(console.error);
    }
  }

  private messageListener(message: Message): void {
    const collector: ReactionCollector = message.createReactionCollector(
      () => true,
      {
        dispose: true,
      }
    );
    collector.on('collect', this.checkRoles.bind(this));
    collector.on('remove', this.checkRoles.bind(this));
  }

  checkRoles(r: MessageReaction): void {
    const roleAssigner: RoleAssigner = new RoleAssigner(r, this.#guild, this);
    this.#guild!.members.fetch().then(
      roleAssigner.membersFetched.bind(roleAssigner)
    );
  }
}
