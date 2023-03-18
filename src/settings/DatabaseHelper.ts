import { Database } from 'sqlite3';

export interface HasId extends Record<string, any> {
  id: string;
}

export default abstract class DatabaseHelper<T extends HasId> {
  #db: Database;

  constructor(file: string) {
    this.#db = new Database(file);
  }

  protected createTable(tableName: string, columns: string[]): Promise<void> {
    let sql: string = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
    for (const [index, column] of columns.entries()) {
      sql += column;
      if (index !== columns.length - 1) sql += ', ';
    }
    sql += ')';
    return this.runQuery(sql, []);
  }

  /**
   * Inserts or updates an object in the table, depending on whether there is already a row with the id stored in the table
   * @param tableName The table to insert or update to
   * @param data The data to insert or update
   */
  protected async insertOrUpdate(tableName: string, data: T): Promise<void> {
    const id = data.id;
    const rows = await this.select(tableName, ['id'], `id = ${id}`);
    if (rows.length === 0) return this.insert(tableName, data);

    return this.update(tableName, data, `id = '${id}'`);
  }

  protected select(
    tableName: string,
    columns: string[],
    whereClause?: string
  ): Promise<any[]> {
    let sql: string = 'SELECT ';
    for (const [index, column] of columns.entries()) {
      sql += column;
      if (index !== columns.length - 1) {
        sql += ', ';
      }
    }
    sql += ` FROM ${tableName}`;
    if (whereClause !== undefined) sql += ` WHERE ${whereClause}`;

    return this.getAllRows(sql, []);
  }

  private insert(tableName: string, data: T): Promise<void> {
    const keys: string = Object.keys(data).join(', ');
    const values: string = Object.keys(data)
      .map((key: string): string => `'${data[key]}'`)
      .join(', ');

    return this.runQuery(
      `INSERT INTO ${tableName} (${keys}) VALUES (${values})`,
      []
    );
  }

  private update(
    tableName: string,
    data: T,
    whereClause?: string
  ): Promise<void> {
    const setClause: string = Object.keys(data)
      .map((key: string): string => `${key} = '${data[key]}'`)
      .join(', ');
    const where: string = whereClause ? ` WHERE ${whereClause}` : '';

    return this.runQuery(`UPDATE ${tableName} SET ${setClause}${where}`, []);
  }

  /**
   * A wrapper around the Database.run function of the sqlite3 library
   * @param sql The SQL query to be executed
   * @param params Parameters for placeholders. Automatically sanitized
   * @returns A void promise, for error handling only
   */
  private runQuery(sql: string, params: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.#db.run(sql, params, (err: Error) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  /**
   * A wrapper around the Database.get function of the sqlite3 library
   * @param sql The SQL query to be executed
   * @param params Parameters for placeholders. Automatically sanitized
   * @returns A promise for an any object containing the data of the row the query fetched
   */
  protected getRow(sql: string, params: any[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.#db.get(sql, params, (err: Error, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  /**
   * A wrapper around the Database.all function of the sqlite3 library
   * @param sql The SQL query to be executed
   * @param params Parameters for placeholders. Automatically sanitized
   * @returns A promise for an any array containing all rows the query fetched
   */
  private getAllRows(sql: string, params: any[]): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      this.#db.all(sql, params, (err: Error, rows: any[]) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
}
