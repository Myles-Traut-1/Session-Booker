import express from "express";
import mongoose from "mongoose";
import config from "config";
import validateConfig from "./config/config";

import { type Server } from "node:http";

const app = express();

app.get('/', (req, res) => {
    res.send("Hello World");
});

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





