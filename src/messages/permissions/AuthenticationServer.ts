import express, { Express } from 'express';
import { Server } from 'http';
import Settings from '../../Settings';
import Authentication, { Listener, MaybeTokenResponse } from './Authentication';

/**
 * Creates an express app for the user to authorize the bot to allow changing command permissions
 */
export default class AuthenticationServer {
  static #app: Express = express();
  static #server?: Server = undefined;

  /**
   * Starts the express server if it has not been started.
   * If no guilds are left that need authentication, the express server is stopped
   */
  public static startServer(): void {
    if (AuthenticationServer.#server !== undefined) {
      if (!AuthenticationServer.#server.listening)
        AuthenticationServer.listen();
      return;
    }
    if (Settings.settings.logging !== 'errors')
      console.log('Start express server');

    AuthenticationServer.#app.get('/', Authentication.authenticationCallback.bind(Authentication));
    AuthenticationServer.listen();
  }

  /**
   * Updates internal server parameter to listen on the app
   */
  private static listen(): void {
    if (
      Settings.settings['express-port'] !== undefined &&
      Settings.settings['express-port'] !== null &&
      Settings.settings['express-port']! > 0
    )
      AuthenticationServer.#server = AuthenticationServer.#app.listen(
        Settings.settings['express-port']
      );
    else AuthenticationServer.#server = AuthenticationServer.#app.listen();
  }

	/**
	 * Closes the server
	 */
	static closeServer(): void {
		this.#server?.close();
	}
}
