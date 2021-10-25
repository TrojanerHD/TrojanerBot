import { Channel } from './messages/StreamerCommand';
import fs from 'fs';

export interface RolesField {
  name: string;
  emoji: string;
  description?: string;
}
export interface SettingsJSON {
  'twitch-id': string;
  'permission-roles': string[];
  roles: RolesField[];
  streamers: string[];
  logging: 'verbose' | 'errors' | 'warnings';
  'streamer-subscriptions': Channel[];
}

export default class Settings {
  private static _settingsFile: string = './settings.json';
  private static _settings: SettingsJSON = {
    'twitch-id': '',
    'permission-roles': [],
    roles: [],
    streamers: [],
    logging: 'warnings',
    'streamer-subscriptions': [],
  };

  static getSettings(): SettingsJSON {
    if (!fs.existsSync(Settings._settingsFile)) {
      Settings.saveSettings();
    } else {
      const settingsFileContent: string = fs.readFileSync(
        Settings._settingsFile,
        'utf8'
      );
      const newSettings: undefined | SettingsJSON =
        Settings.getJsonString(settingsFileContent);
      if (!newSettings) Settings.saveSettings();
      else if (
        Object.keys(Settings._settings).find(
          (key: string): boolean => !(key in newSettings)
        )
      ) {
        for (const untypedSetting of Object.keys(newSettings)) {
          const setting: keyof SettingsJSON = untypedSetting as keyof SettingsJSON;
          Settings._settings[setting] = newSettings[setting] as any;
        }
        Settings.saveSettings();
      }
      Settings._settings = JSON.parse(settingsFileContent);
    }
    return Settings._settings;
  }

  private static getJsonString(str: string): undefined | SettingsJSON {
    try {
      return JSON.parse(str);
    } catch (e) {
      return undefined;
    }
  }

  static saveSettings(): void {
    fs.writeFileSync(
      Settings._settingsFile,
      JSON.stringify(Settings._settings, null, 2),
      'utf8'
    );
  }
}
