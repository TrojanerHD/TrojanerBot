import { Channel } from './messages/StreamerCommand';
import fs from 'fs';

export interface SettingsJSON {
  prefix: string;
  'delete-messages-on-error': boolean;
  'twitch-id': string;
  roles: { name: string; emoji: string }[];
  streamers: string[];
  'streamer-subscriptions': Channel[];
}

export default class Settings {
  private static _settingsFile: string = './settings.json';
  private static _settings: SettingsJSON = {
    prefix: '!',
    'delete-messages-on-error': true,
    'twitch-id': '',
    roles: [],
    streamers: [],
    'streamer-subscriptions': [],
  };

  static getSettings(): SettingsJSON {
    if (!fs.existsSync(Settings._settingsFile)) {
      Settings.saveSettings();
    } else {
      let settingsFileContent: string = fs.readFileSync(
        Settings._settingsFile,
        'utf8'
      );
      if (!Settings.isJsonString(settingsFileContent)) Settings.saveSettings();
      else Settings._settings = JSON.parse(settingsFileContent);
    }
    return Settings._settings;
  }

  private static isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  static saveSettings(): void {
    fs.writeFileSync(Settings._settingsFile, JSON.stringify(Settings._settings, null, 2), 'utf8');
  }
}
