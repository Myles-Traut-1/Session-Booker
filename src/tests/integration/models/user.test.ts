import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup";


describe("Booking Tests", () => {
    beforeAll(async () => {
        await connectToDb();
    });
    afterEach(async () => {
        await clearDatabase();
    });
    afterAll( async () => {
        await disconnectFromDb();
    });

    it("Placeholder", async() => {
        expect(true).toBe(true);    
    });
});