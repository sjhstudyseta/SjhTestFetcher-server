import { config } from 'dotenv';
import express, { type Request, type Response, type NextFunction } from 'express';

// config .env
config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

const state = {
    priority: false,
    default: false,
    cookie: "",

    update: (isAuthenticated: boolean, value: boolean) => {
        isAuthenticated ? state.priority = value : state.default = value;
    }
};

console.log("start");