import express from "express";
import mongoose from "mongoose";
import config from "config";
import validateConfig from "./config/config";

import { type Server } from "node:http";

/** ------- MIDDLEWARE IMPORTS -------- */

import error from "../src/middleware/error";

/** -------- ROUTE IMPORTS -------- */

import auth from "../src/routes/auth";

const app = express();

/** -------- MIDDLEWARES -------- */
app.use(express.json());

/** -------- ROUTES -------- */
app.use("/api/auth", auth);

app.get('/health', (req, res) => {
    res.send("okay");
});

/** -------- ERROR MIDDLWARE -------- */
app.use(error);

/** -------- STARTUP -------- */

export async function startServer(): Promise<Server> {
    validateConfig();

    const port = process.env.PORT || 3000;

    await mongoose.connect(config.get("db"));
    console.log("connected to booking db");
        
    const server = app.listen(port, () => {
        console.log(`listening on port: ${port}`)
    });
            
    return server;
}

// Tests use app directly
export { app }

// Only actually start the server if this file is run directly,
// not when it's imported by a test file
if(require.main === module) {
    startServer().catch(err => {
        console.error("FATAL ERROR: could not start server", err)
        process.exit(1)
    });
}





