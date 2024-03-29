import { Channel } from './messages/StreamerCommand';
import fs from 'fs';
import DMManager from './twitch/DMManager';

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
  'express-port'?: number;
  proxy?: {
    host: string;
    port: number;
  };
}

/**
 * A settings wrapper
 */
export default class Settings {
  /**
   * The file where the settings are stored
   */
  private static _settingsFile: string = './settings.json';
  /**
   * The actual settings to edit. Contains the default settings at the beginning
   */
  private static _settings: SettingsJSON = {
    'twitch-id': '',
    'permission-roles': [],
    roles: [],
    streamers: [],
    logging: 'warnings',
    'streamer-subscriptions': [],
  };

  /**
   * Retrieves valid settings from file (with hot reload) and overwrites every non-valid setting in the file with the previous value
   */
  static get settings(): SettingsJSON {
    // If settings file does not exist, simply create and fill it
    if (!fs.existsSync(Settings._settingsFile)) {
      Settings.saveSettings();
    } else {
      // Read the new settings from file and parse them to json
      const settingsFileContent: string = fs.readFileSync(
        Settings._settingsFile,
        'utf8'
      );
      const newSettings: undefined | SettingsJSON =
        Settings.getJsonString(settingsFileContent);
      if (!newSettings) Settings.saveSettings();
      else {
        let changed: boolean = false;
        // If some keys do not exist in the new settings read from file, set these settings back to the already stored value (before the read)
        if (
          Object.keys(Settings._settings).some(
            (key: string): boolean => !(key in newSettings)
          )
        ) {
          // Every key that exists in the new settings is being iterated over
          for (const untypedSetting of Object.keys(newSettings)) {
            // Type the setting key to be a valid key for the SettingsJSON array
            const setting: keyof SettingsJSON =
              untypedSetting as keyof SettingsJSON;
            // Store every found setting from the new settings into the local settings
            // @ts-ignore
            Settings._settings[setting] = newSettings[setting] as any;
          }
          changed = true;
        }
        // Backwards compatibility: This is a hard-coded checker to see if every streamer has a sent boolean because there was a version where it was not there
        for (const i of [
          ...Settings._settings['streamer-subscriptions'].entries(),
        ]
          .filter(
            (channelWithIndex: [number, Channel]): boolean =>
              channelWithIndex[1].sent === undefined
          )
          .map(
            (channelWithIndex: [number, Channel]): number => channelWithIndex[0]
          )) {
          Settings._settings['streamer-subscriptions'][i].sent = false;
          changed = true;
        }
        // Backwards compatibility: If users added streamers with invalid characters in previous versions of the bot, they get deleted
        if (
          Settings._settings['streamer-subscriptions'].some(
            (channel: Channel): boolean =>
              !channel.streamer.match(DMManager.validNameRegex)
          )
        ) {
          Settings._settings['streamer-subscriptions'] = Settings._settings[
            'streamer-subscriptions'
          ].filter(
            (channel: Channel): boolean =>
              !!channel.streamer.match(DMManager.validNameRegex)
          );
          changed = true;
        }
        if (changed) Settings.saveSettings();
      }
      Settings._settings = JSON.parse(settingsFileContent);
    }
    return Settings._settings;
  }

  /**
   * Returns given string as SettingsJSON if it is valid JSON
   * @param str The string to check
   * @returns The parsed JSON if it was valid, otherwise undefined
   */
  private static getJsonString(str: string): undefined | SettingsJSON {
    try {
      return JSON.parse(str);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Saves the settings to the specified settings file
   */
  static saveSettings(): void {
    fs.writeFileSync(
      Settings._settingsFile,
      JSON.stringify(Settings._settings, null, 2),
      'utf8'
    );
  }
}
