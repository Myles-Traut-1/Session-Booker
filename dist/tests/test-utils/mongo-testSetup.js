"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearDatabase = exports.disconnectFromDb = exports.connectToDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectToDb = async () => {
    await mongoose_1.default.connect(process.env.MONGO_URI);
};
exports.connectToDb = connectToDb;
const disconnectFromDb = async () => {
    await mongoose_1.default.connection.close();
};
exports.disconnectFromDb = disconnectFromDb;
const clearDatabase = async () => {
    const connections = mongoose_1.default.connection.collections;
    for (const key in connections) {
        await connections[key].deleteMany({});
    }
};
exports.clearDatabase = clearDatabase;
