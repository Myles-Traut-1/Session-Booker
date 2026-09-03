"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
const mongodb_memory_server_1 = require("mongodb-memory-server");
let replset;
async function globalSetup() {
    replset = await mongodb_memory_server_1.MongoMemoryReplSet.create({
        replSet: { count: 1 }
    });
    process.env.MONGO_URI = replset.getUri();
    globalThis.__MONGO_REPLSET__ = replset;
}
