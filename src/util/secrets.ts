import { config } from 'dotenv';

config({ quiet: true });

export const PORT = process.env.PORT || 3000;
export const KEY = process.env.KEY;
export const USER_ID = process.env.USER_ID;
export const PASSWORD = process.env.PASSWORD;