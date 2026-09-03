"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const config_1 = __importDefault(require("config"));
function default_1() {
    if (!config_1.default.get("jwtPrivateKey")) {
        throw new Error("FATAL ERROR... jwtPrivateKey not set");
    }
}
