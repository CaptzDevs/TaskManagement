import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'assets')))

import dotenv from 'dotenv';
import axios from 'axios';

if (process.env.NODE_ENV === 'prod') {
    dotenv.config({ path: '.env.prod' });
} else {
    dotenv.config({ path: '.env.dev' });
}

import taskRouter from './routes/task.js';

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, '/views'));

const api = axios.create({
    baseURL: process.env.BASE_URL,
    timeout: 15000,
});

// Allow all origins with all methods
app.use(cors());
app.disable('x-powered-by');


app.use((req, res, next) => {
    
    console.log("*------ Request ------");

    console.log(`${req.method} : ${req.url}`)
    next();
});

function listRoutes() {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(middleware.route);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                const route = handler.route;
                route && routes.push(route);
            });
        }
    });

    return routes;
}



app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


app.use('/api',taskRouter)

    const port = process.env.PORT || 8080;
    const server = app.listen(port, () => {
        console.log(`start at  http://localhost:${port}`)
    })


