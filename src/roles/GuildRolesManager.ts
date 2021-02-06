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
  private _guild: Guild;
  private _rolesChannel: TextChannel | undefined;
  private _newEmbed: EmojiEmbed | undefined;
  private _newEmbeds: EmojiEmbed[] | undefined;
  private _reaction: MessageReaction | undefined;
  private _members: Collection<string, GuildMember> | undefined;
  private _block: boolean = false;

  constructor(guild: Guild) {
    this._guild = guild;
  }

  checkRolesChannel(rolesChannel: TextChannel, newEmbeds: EmojiEmbed[]): void {
    this._newEmbeds = newEmbeds;
    this._rolesChannel = rolesChannel;
    this._rolesChannel.messages
      .fetch({ limit: 10 })
      .then(this.messagesFetched.bind(this))
      .catch(console.error);
  }

  private messagesFetched(messages: Collection<Snowflake, Message>): void {
    const rolesMessages = messages.array();
    for (let i = 0; i < this._newEmbeds!.length; i++) {
      this._newEmbed = this._newEmbeds![i];
      if (!rolesMessages[i]) {
        this._rolesChannel!.send(this._newEmbed!.embed)
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
        .edit(this._newEmbed!.embed)
        .catch(console.error)
        .then((message: void | Message) => {
          if (!(message instanceof Message)) return;
          const wrongEmojis: MessageReaction[] = message.reactions.cache
            .filter(
              (reaction: MessageReaction) =>
                !Settings.getSettings().roles.find(
                  (role: CustomRole) => role.name === reaction.emoji.name
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
    for (const emoji of this._newEmbed!.usedEmoji) {
      if (this._guild!.emojis.cache.array().length === 0) return;
      message
        .react(this._guild!.emojis.cache.get(emoji)!)
        .then(this.messageListener.bind(this))
        .catch(console.error);
    }
  }

  private messageListener(reaction: MessageReaction): void {
    //const filter = (reaction: MessageReaction) => reaction.emoji.name === '👌';
    const collector = reaction.message.createReactionCollector(() => true, {
      dispose: true,
    });
    collector.on('collect', this.checkRoles.bind(this));

    collector.on('remove', this.checkRoles.bind(this));
  }

  private checkRoles(r: MessageReaction): void {
    this._reaction = r;

    this._guild!.members.fetch().then(this.membersFetched.bind(this));
  }

  private membersFetched(members: Collection<string, GuildMember>): void {
    this._members = members;
    this._guild.roles.fetch().then(this.rolesFetched.bind(this));
  }

  private rolesFetched(roles: RoleManager): void {
    if (this._block) return;
    const roleName: string | undefined = Settings.getSettings().roles.find(
      (role: CustomRole) => role.emoji === this._reaction!.emoji.id
    )?.name;
    let role: Role | undefined = roles.cache
      .array()
      .find((role: Role) => role.name === roleName);
    if (!role) {
      this._guild.roles
        .create({
          data: { name: roleName, mentionable: true },
        })
        .then(() => {
          this._block = false;
          this.checkRoles(this._reaction!);
        })
        .catch(console.error);
      this._block = true;
      return;
    }
    const reactors: User[] = this._reaction!.users.cache.array();
    for (const member of this._members!.array()) {
      const user: User = member.user;
      if (user.bot) continue;
      if (member.roles.cache.array().includes(role) && !reactors.includes(user))
        member.roles.remove(role);
      if (!member.roles.cache.array().includes(role) && reactors.includes(user))
        member.roles.add(role);
    }
  }
}
