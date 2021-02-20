import {
  Collection,
  Guild,
  GuildMember,
  Message,
  MessageReaction,
  Role,
  RoleManager,
  Snowflake,
  TextChannel,
  User,
} from 'discord.js';
import { DiscordClient } from '../DiscordClient';
import Settings from '../Settings';
import { EmojiEmbed, CustomRole } from './RoleChannelManager';

export default class GuildRolesManager {
  #guild: Guild;
  #rolesChannel?: TextChannel;
  #newEmbed?: EmojiEmbed;
  #newEmbeds?: EmojiEmbed[];
  #reaction?: MessageReaction;
  #members?: Collection<string, GuildMember>;
  #block: boolean = false;

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
                  (role: CustomRole) => role.emoji === reaction.emoji.id || role.emoji === reaction.emoji.name
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
    for (const emoji of this.#newEmbed!.usedEmoji) {
      if (this.#guild!.emojis.cache.array().length === 0) return;
      message
        .react(emoji)
        .then(this.messageListener.bind(this))
        .catch(console.error);
    }
  }

  private messageListener(reaction: MessageReaction): void {
    const collector = reaction.message.createReactionCollector(() => true, {
      dispose: true,
    });
    collector.on('collect', this.checkRoles.bind(this));

    collector.on('remove', this.checkRoles.bind(this));
  }

  private checkRoles(r: MessageReaction): void {
    this.#reaction = r;

    this.#guild!.members.fetch().then(this.membersFetched.bind(this));
  }

  private membersFetched(members: Collection<string, GuildMember>): void {
    this.#members = members;
    this.#guild.roles.fetch().then(this.rolesFetched.bind(this));
  }

  private rolesFetched(roles: RoleManager): void {
    if (this.#block) return;
    const roleName: string | undefined = Settings.getSettings().roles.find(
      (role: CustomRole) => role.emoji === this.#reaction!.emoji.id || role.emoji === this.#reaction!.emoji.name
    )?.name;
    let role: Role | undefined = roles.cache
      .array()
      .find((role: Role) => role.name === roleName);
    if (!role) {
      this.#guild.roles
        .create({
          data: { name: roleName, mentionable: true },
        })
        .then(() => {
          this.#block = false;
          this.checkRoles(this.#reaction!);
        })
        .catch(console.error);
      this.#block = true;
      return;
    }
    const reactors: User[] = this.#reaction!.users.cache.array();
    for (const member of this.#members!.array()) {
      const user: User = member.user;
      if (user.bot) continue;
      if (member.roles.cache.array().includes(role) && !reactors.includes(user))
        member.roles.remove(role);
      if (!member.roles.cache.array().includes(role) && reactors.includes(user))
        member.roles.add(role);
    }
  }
}
