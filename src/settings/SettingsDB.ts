import DatabaseHelper from './DatabaseHelper';

export interface RolesField {
  name: string;
  emoji: string;
  description?: string;
}

export interface GuildInfo {
  permissionRoles: string[];
  roles: RolesField[];
  streamers: string[];
  refreshToken: string;
}

export interface CachedGuildInfo {
  id: string;
  info: GuildInfo;
}

export interface DatabaseGuildInfo {
  id: string;
  permissionRoles: string;
  roles: string;
  streamers: string;
  refreshToken: string;
}

/**
 * A helper to help interact with the settings database
 */
export default class SettingsDB extends DatabaseHelper<DatabaseGuildInfo> {
  #cache: CachedGuildInfo[] = [];

  constructor(file: string) {
    super(file);
    this.initDatabase().catch(console.error);
  }

  /**
   * Gets a server's configuration from the database
   * @param id The Guild ID to identify the rows
   * @returns A promise of a ServerInfo interface containing all of the row's data
   */
  public getGuild(id: string): Promise<GuildInfo> {
    return new Promise<GuildInfo>(async (resolve, reject) => {
      const i: number = this.#cache.findIndex(
        (info: CachedGuildInfo) => info.id === id
      );

      if (i !== -1) {
        resolve(this.#cache[i].info);
        return;
      }

      try {
        const rows: DatabaseGuildInfo[] = await this.select(
          'server',
          ['*'],
          `id = ${id}`
        );
        let row: DatabaseGuildInfo;
        if (rows.length === 0)
          row = {
            id,
            permissionRoles: '[]',
            roles: '[]',
            streamers: '[]',
            refreshToken: '',
          };
        else row = rows[0];
        const serverInfo: GuildInfo = {
          permissionRoles: JSON.parse(row.permissionRoles),
          roles: JSON.parse(row.roles),
          streamers: JSON.parse(row.streamers),
          refreshToken: row.refreshToken,
        };
        this.#cache.push({ id, info: serverInfo });
        resolve(serverInfo);
      } catch (e: unknown) {
        reject(e);
      }
    });
  }

  /**
   * Updates data in the database. The row to be updated is chosen from the ID in the data object.
   * Creates a new row if no row with the provided id exists
   * @param id The server ID to update the server info
   * @param data A ServerInfo object containing the data to be written.
   * @returns A void promise, for error handling only
   */
  public updateGuild(id: string, data: GuildInfo): Promise<void> {
    const i: number = this.#cache.findIndex(
      (value: CachedGuildInfo) => value.id === id
    );
    if (i !== -1) {
      this.#cache[i].info = data;
    } else {
      this.#cache.push({ id, info: data });
    }
    const mappedData: DatabaseGuildInfo = {
      id,
      permissionRoles: JSON.stringify(data.permissionRoles),
      roles: JSON.stringify(data.roles),
      streamers: JSON.stringify(data.streamers),
      refreshToken: data.refreshToken,
    };

    return this.upsert('server', mappedData);
  }

  /**
   * Creates all required tables if they don't exist.
   * @returns A void promise, for error handling only
   */
  private initDatabase(): Promise<void> {
    return this.createTable('server', [
      'id VARCHAR(25) NOT NULL PRIMARY KEY',
      'permissionRoles TEXT',
      'roles TEXT',
      'streamers TEXT',
      'refreshToken TEXT',
    ]);
  }
}
