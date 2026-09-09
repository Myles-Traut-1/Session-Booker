import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup"

import request from "supertest";
import { type Response } from "superagent";

import { app } from "../../../index";

describe("api/auth/", () => {
    beforeAll(async () => {
        await connectToDb();
    });
    afterEach(async() => {
        await clearDatabase();
    });
    afterAll(async () => {
        await disconnectFromDb();
    });

    describe("POST/ register",() => {

        const executeRequest = () => {
            return request(app).post("/api/auth/register").send({
                name: "Myles",
                email: "myles@testEmail.com",
                password: "123456"
            });
        }
        
        it("should retun 200 status for successful request", async() => {
            const res: Response = await executeRequest();
            expect(res.status).toBe(200);
        });
    });


});