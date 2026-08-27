import { MongoMemoryReplSet } from "mongodb-memory-server";

let replset: MongoMemoryReplSet;

export default async function globalSetup() {
    replset = await MongoMemoryReplSet.create({
        replSet: {count: 1}
    });

    process.env.MONGO_URI = replset.getUri();
    (globalThis as any).__MONGO_REPLSET__ = replset; 
}