"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
function globalTeardown() {
    const replset = globalThis.__MONGO_REPLSET__;
    replset?.stop();
}
