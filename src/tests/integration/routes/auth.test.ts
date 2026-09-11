import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup"
import mongoose from "mongoose";
import { app } from "../../../index";

import request from "supertest";
import bcrypt from "bcrypt";

import { User, type IUser } from "../../../models/users";
import { type Response } from "superagent";
import { type IRequestInput } from "../../../types/types";

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
            expect(res.text).toMatch(/is not allowed to be empty/i);
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

    describe("POST/ login", () => {
        let user: IUser;
        let userId: mongoose.Types.ObjectId;
        let username: string;
        let userEmail: string;
        let userPassword: string;
        let hashedPassword: string;
        let salt: string;

        const executeRequest = () => {
            return request(app).post("/api/auth/login").send({
                email: userEmail,
                password: userPassword
            });
        }

        beforeEach(async () => {
            userId = new mongoose.Types.ObjectId();
            username = "Myles";
            userEmail = "testmail@testemail.com";
            userPassword = "123456";

            salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(userPassword, salt);

            user = await User.create({
                _id: userId,
                name: username,
                email:userEmail,
                passwordHash: hashedPassword
            });
        });

        it("should return 200 status for successful request", async() => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
        });
        it("should return 400 status for bad request", async() => {
            userEmail = "";
            const res = await executeRequest();
            
            expect(res.status).toBe(400);
            expect(res.text).toMatch(/is not allowed to be empty/i);
        });
        it("should return 400 status and generic error for incorrect eamil or password", async() => {
            userEmail = "1234@mail.com";
            let res = await executeRequest();
            
            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid email or password/i);

            userEmail = "testmail@testemail.com";
            userPassword = "654321";

            res = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid email or password/i);
        });
        it("should set the token in the request header", async () => {
            const res = await executeRequest();

            expect(res.header["x-auth-token"]).not.toBeNull();
        });
        it("should return the email to the client", async() => {
            const res = await executeRequest();

            expect(res.body).toHaveProperty("email", userEmail);
        });
    });
});