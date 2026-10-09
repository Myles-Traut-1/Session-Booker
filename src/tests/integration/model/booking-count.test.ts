import mongoose from "mongoose";
import { connectToDb, disconnectFromDb, clearDatabase } from "../../test-utils/mongo-testSetup";
import { WeeklyBookingCount, type IWeeklyBookingCount } from "../../../models/booking-count";
import { User, type IUser } from "../../../models/users";

import { getStartOfWeek } from "../../../services/booking-service";

describe("weekly booking count tests", () => {
    beforeAll(async () => {
        await connectToDb();
    });
    afterEach(async() => {
        await clearDatabase();
    });
    afterAll(async () => {
        await disconnectFromDb();
    });
    
    let userId: mongoose.Types.ObjectId;
    let user: IUser;
    let startOfWeek: Date;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId();
        user = new User({_id: userId});

        startOfWeek = await getStartOfWeek();
    });

    it("should create a document if none exits and then increment to weeklyCount to 1", async() => {
        let weeklyBookingDoc: IWeeklyBookingCount | null = await WeeklyBookingCount.findOneAndUpdate({
            studentId : userId,
            weekStart: startOfWeek
        }, 
        {
            $setOnInsert: {weeklyCount: 0}
        },
        {
            returnDocument: "after", upsert: true
        },
        );

        expect(weeklyBookingDoc).not.toBeNull();
        expect((weeklyBookingDoc as IWeeklyBookingCount).weeklyCount).toEqual(0);

        weeklyBookingDoc = await WeeklyBookingCount.findOneAndUpdate({
            studentId : userId,
            weekStart: startOfWeek,
            weeklyCount: {$lt: 3}}, 
            {$inc: {
                    weeklyCount: 1
            }},
            {returnDocument: "after"},
        );

        expect((weeklyBookingDoc as IWeeklyBookingCount).weeklyCount).toEqual(1);
    });

    it("should revert if weeklyCount equals 3", async() => {
        await WeeklyBookingCount.insertOne({
            studentId : userId,
            weekStart: startOfWeek,
            weeklyCount: 3
        });

        let weeklyBookingDoc: IWeeklyBookingCount | null = await WeeklyBookingCount.findOneAndUpdate({
            studentId : userId,
            weekStart: startOfWeek,
            weeklyCount: {$lt: 3}}, 
            {$inc: {
                    weeklyCount: 1
            }},
            {returnDocument: "after"},
        );

        expect(weeklyBookingDoc).toBeNull();
    });
});