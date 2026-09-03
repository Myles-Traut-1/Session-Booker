"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default.connect("mongodb://127.0.0.1:27017/Session-Booker?directConnection=true")
    .then(() => console.log("connected to booking db")).catch();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`listening on port: ${port}`);
});
app.get('/', (req, res) => {
    res.send("Hello World");
});
exports.default = server;
