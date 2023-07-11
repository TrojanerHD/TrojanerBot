import DiscordClient from './DiscordClient';
import dotenv from 'dotenv';

// Load dotenv config
dotenv.config();

//Entry point: The discord bot logs in
new DiscordClient().login();

process.on('SIGTERM', (): never => process.exit(1));

process.on('SIGINT', (): never => process.exit(1));
