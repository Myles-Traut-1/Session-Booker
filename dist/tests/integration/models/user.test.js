"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_testSetup_1 = require("../../test-utils/mongo-testSetup");
describe("Booking Tests", () => {
    beforeAll(async () => {
        await (0, mongo_testSetup_1.connectToDb)();
    });
    afterEach(async () => {
        await (0, mongo_testSetup_1.clearDatabase)();
    });
    afterAll(async () => {
        await (0, mongo_testSetup_1.disconnectFromDb)();
    });
    it("Placeholder", async () => {
        expect(true).toBe(true);
    });
});
