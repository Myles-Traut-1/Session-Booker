import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup"

import { Booking } from "../../../models/bookings";
import { User } from "../../../models/users";
import { app } from "../../../index";

import { normalizeDateToMidnightUTC } from "../../../utils/utils";

import request from "supertest";

describe("/api/booking", () => {
    beforeAll(async () => {
        await connectToDb();
    });
    afterEach(async() => {
        await clearDatabase();
    });
    afterAll(async () => {
        await disconnectFromDb();
    });
    
    describe("POST /", () => {
        let day: string;
        let slot: number;
        let token: string;

        const executeRequest = () => {
            return request(app).post('/api/bookings').set("x-auth-token", token).send({
                date: day,
                slotIndex: slot
            });
        }

        beforeEach(async() => {
            day = new Date().toISOString();
            slot = 0;

            token = new User().generateAuthToken();
        });



        it("should return a 200 status on success", async () => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
        });
        it("should return a 400 response for bad request", async() => {
            day = new Date().toString(); // Malformated input
            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/must be in iso format/);
        });
        it("should return 401 response if not logged in", async() => {
            token = "";
            const res = await executeRequest();

            expect(res.status).toBe(401);
            expect(res.text).toMatch(/No token provided/);
        });
        it("should create a new booking in the db", async() => {
            await executeRequest();

            const bookingInDb = await Booking.findOne({date: day, slotIndex: slot});

            expect(bookingInDb).toHaveProperty("student")
            expect(bookingInDb).toHaveProperty("date",normalizeDateToMidnightUTC(day));
            expect(bookingInDb).toHaveProperty("slotIndex", slot);
            expect(bookingInDb).toHaveProperty("createdAt");
            expect(bookingInDb).toHaveProperty("updatedAt");

        });
        it("should revert and return 409 status if booking the same date and slot", async() => {
            await executeRequest();

            const res = await executeRequest();

            expect(res.status).toBe(409);
            expect(res.text).toMatch(/slot was just booked/);
        });
    });
});
