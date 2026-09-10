import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup"

import request from "supertest";
import bcrypt from "bcrypt";

import { User, type IUser } from "../../../models/users";
import { type Response } from "superagent";
import { type IRequestInput } from "../../../types/types";

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
        let payload: IRequestInput;

        beforeEach(() => {
            payload = {
                name: "Myles",
                email: "myles@testEmail.com",
                password: "123456"
            }
        });


        const executeRequest = () => {
            return request(app).post("/api/auth/register").send(payload);
        }
        
        it("should retun 200 status for successful request", async() => {
            const res: Response = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 400 status on bad request", async () => {
            payload.name = "";

            const res: Response = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Bad request/i);
        });
        it("should return 400 status if user already registered", async () => {
            let res: Response = await executeRequest();
            expect(res.status).toBe(200);

            res = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.text).toMatch(/already registered/i);
        });
        it("user object should be created for successful request", async() => {
            let user: IUser | null = await User.findOne({email: payload.email});
            expect(user).toBeNull();

            const res: Response = await executeRequest();

            user = await User.findOne({email: payload.email});
            expect(user).toHaveProperty("_id");
            expect(user).toHaveProperty("role", "student");

            const validPassword = await bcrypt.compare(payload.password, (user as IUser).passwordHash);
            expect(validPassword).toEqual(true);
        });
        it("should add jwt to header on success", async() => {
            const res: Response = await executeRequest();

            expect(res.header["x-auth-token"]).not.toBeNull();
        });
    });


});