import { Guild } from 'discord.js';
import FeatureChecker from '../FeatureChecker';
import SettingsDB, { GuildInfo } from './SettingsDB';

export default class GuildSettings {
  static readonly #db = new SettingsDB('./settings.db');

	public static settings(id: string): Promise<GuildInfo> {
		return GuildSettings.#db.getGuild(id);
	}

  public static async saveSettings(guild: Guild, settings: GuildInfo): Promise<void> {
    await GuildSettings.#db.updateGuild(guild.id, settings).catch(console.error);
		await new FeatureChecker().checkGuild(guild).catch(console.error);
  }
}
