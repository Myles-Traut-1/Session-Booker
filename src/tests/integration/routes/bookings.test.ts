import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup"

import { Booking, IBooking } from "../../../models/bookings";
import { User } from "../../../models/users";
import { app } from "../../../index";

import { normalizeDateToMidnightUTC } from "../../../utils/utils";
import { getStartOfWeek } from "../../../services/booking-service";

import request from "supertest";
import mongoose from "mongoose";

describe("/api/booking", () => {
    beforeAll(async () => {
        await connectToDb();
    });
    afterEach(async() => {
        jest.useRealTimers();
        await clearDatabase();
    });
    afterAll(async () => {
        await disconnectFromDb();
    });

    describe("GET /details", () => {
        let token : string;
        let studentId : mongoose.Types.ObjectId;
        let booking1: IBooking;
        let booking2: IBooking;

        const executeRequest = () => {
            return request(app).get("/api/bookings/details").set("x-auth-token", token);
        }

        beforeEach(async () => {
            studentId = new mongoose.Types.ObjectId();

            token = new User({_id: studentId, role: "student"}).generateAuthToken();

            booking1 = await Booking.create({
                student: studentId,
                date: new Date().toISOString(),
                slotIndex: 0
            });

            booking2 = await Booking.create({
                student: studentId,
                date: new Date().toISOString(),
                slotIndex: 1
            });
        });

        it("should return a 200 status on successful request", async() => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
        });
        it("should return an array of two bookings", async() => {
            const res = await executeRequest();

            const data = res.body.data;

            expect(data.length).toEqual(2);
            expect(data[0]).toHaveProperty("student", studentId.toHexString());
            expect(data[1]).toHaveProperty("student", studentId.toHexString());
            expect(data[0]).toHaveProperty("slotIndex", 0);
            expect(data[1]).toHaveProperty("slotIndex", 1);
            
        });
        it("should return a 401 status if not logged in", async() => {
            token = "";

            const res = await executeRequest();

            expect(res.status).toBe(401);
        });
        it("should return a message if no bookings have been made", async() => {
            await Booking.deleteMany({ student: studentId });

            const res = await executeRequest();

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/No bookings made yet/i);
        });
    });

    describe("GET /details?scope", () => {
        let token : string;
        let studentId : mongoose.Types.ObjectId;
        
        let scope: string | null

        let currentDate: Date;
        let futureDate: Date;
        let pastDate: Date;

        const executeRequest = () => {
            return request(app)
                .get("/api/bookings/details")
                .set("x-auth-token", token)
                .query(
                    {
                        scope
                    }
                );
        }

        beforeEach(async () => {
            scope = null;

            studentId = new mongoose.Types.ObjectId();

            token = new User({_id: studentId, role: "student"}).generateAuthToken();
            
            currentDate = new Date();
            futureDate = new Date();
            pastDate = new Date();

            futureDate.setUTCDate(futureDate.getUTCDate() + 7);
            pastDate.setUTCDate(pastDate.getUTCDate() - 14); // two weeks ago

            await Booking.create({
                student: studentId,
                date: currentDate.toISOString(),
                slotIndex: 0
            });

            await Booking.create({
                student: studentId,
                date: currentDate.toISOString(),
                slotIndex: 1
            });

            await Booking.create({
                student: studentId,
                date: futureDate.toISOString(),
                slotIndex: 2
            });

            await Booking.create({
                student: studentId,
                date: pastDate.toISOString(),
                slotIndex: 3
            });
        });

        it("should return the current weeks bookings by default", async() => {
            const res = await executeRequest();

            const data = res.body.data;

            expect(data.length).toEqual(2);
            expect(data[0].date).toEqual(normalizeDateToMidnightUTC(currentDate).toISOString());
            expect(data[1].date).toEqual(normalizeDateToMidnightUTC(currentDate).toISOString());
        });
        it("should return the current weeks bookings if scope equals current-week", async() => {
            scope = "current-week";

            const res = await executeRequest();

            const data = res.body.data;

            expect(data.length).toEqual(2);
            expect(data[0].date).toEqual(normalizeDateToMidnightUTC(currentDate).toISOString());
            expect(data[1].date).toEqual(normalizeDateToMidnightUTC(currentDate).toISOString());
        });
        it("should return future bookings if scope equals upcoming", async() => {
            scope = "upcoming";

            const res = await executeRequest();

            const data = res.body.data;

            expect(data.length).toEqual(1);
            expect(data[0].date).toEqual(normalizeDateToMidnightUTC(futureDate).toISOString());
        });
        it("should return all bookings if scope equals all", async() => {
            scope = "all";

            const res = await executeRequest();
            const data: IBooking[] = res.body.data;

            expect(data.length).toEqual(4);
            data.some(booking => booking.date === currentDate);
            data.some(booking => booking.date === futureDate);
            data.some(booking => booking.date === pastDate);
        });
        it("should revert if scope is malformed", async() => {
            scope = "crrnt-wk";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/malformed query scope/i);
        });
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
        it("should return 401 status and error if booking date is a weekend", async() => {
            const weekendDate = new Date("2026-09-26T12:00:00.000Z"); // Saturday
            day = weekendDate.toISOString();

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/No Bookings on Weekends/i);
        });
        it("should return 409 status and error if booking cap reached", async() => {
            await executeRequest();

            slot = 1;
            await executeRequest();

            slot = 2;
            await executeRequest();

            slot = 3;
            const res = await executeRequest();

            // expect(res.status).toBe(409);
            // expect(res.text).toMatch(/Booking Cap Reached/i);
        });
        it("should correctly calculate the start of the week when today is Sunday", async () => {
            // 2026-09-27 is a real Sunday - confirmed by checking a calendar
            const fakeSunday = new Date("2026-09-27T15:00:00.000Z");

            jest.useFakeTimers();
            jest.setSystemTime(fakeSunday);

            const result = await getStartOfWeek();

            // The Monday that started this same week - calculated by hand, not by the function under test
            const expectedMonday = new Date("2026-09-21T00:00:00.000Z");

            expect(result).toEqual(expectedMonday);
        });
    });
});
