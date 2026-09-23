import express, { type NextFunction, type Request, type Response } from "express";
import Joi from "joi";

import { Booking, type IBooking } from "../models/bookings";
import { auth, admin } from "../middleware/auth";

import { normalizeDateToMidnightUTC } from "../utils/utils"
import mongoose from "mongoose";
import { AuthResponse } from "../types";

const router = express.Router();

interface IBookingRequest {
    date: string,
    time: string
}

/** -------- POST -------- */
/// TODO Add race condition prevention via WeeklyBooking Schema
router.post('/', auth, async(req: Request, res: Response, next: NextFunction) => {
    const { error } = validateBookingRequest(req.body);
    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }

    const id = (req.user as AuthResponse)._id;

    const normalizedBookingDate = normalizeDateToMidnightUTC(req.body.date);

    if(normalizedBookingDate.getUTCDay() === 0 || normalizedBookingDate.getUTCDay() === 6) {
        return res.status(400).json({error: "No Bookings on Weekends"});
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const bookingCap = await checkBookingCap(id, session);
        
        // Max 3 bookings per week
        if(bookingCap >= 3) {
            await session.abortTransaction();
            return res.status(409).json({error: "Weekly Booking Cap Reached"});
        }


        const [booking] = await Booking.create([{
            student: id,
            date: normalizedBookingDate,
            slotIndex: req.body.slotIndex
        }], {session});

        await session.commitTransaction();

        return res.status(200).json({data: booking});

    } catch(err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
});

export default router;

const validateBookingRequest = (booking: IBookingRequest) => {
    const schema = Joi.object({
        date: Joi.string().isoDate().required(),
        slotIndex: Joi.number().min(0).max(8).required()
    })

    return schema.validate(booking);
}

const checkBookingCap = async (id: string, session: mongoose.ClientSession): Promise<number> => {
    const startOfWeek = await getStartOfWeek();
    const endOfWeek = await getEndOfWeek(startOfWeek);


    const bookingCount = await Booking.countDocuments(
        {
            student: id, 
            date: {
                $gte: startOfWeek,
                $lt: endOfWeek
            }
        }
    ).session(session);

    return bookingCount;
}

const getStartOfWeek = async (): Promise<Date> =>  {
    // returns numbers 0 - 6 representing days o the week. Sunday = 0. Saturday = 6
    const { monday, day } = await getWeekBoundries();

    // How many days since today was the last monday. 
    // If Sunday, then it was 6 days since the last Monday
    const daysToCheck = day === 0 ? 6 : day - monday;

    const  startOfWeek = normalizeDateToMidnightUTC(new Date());
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysToCheck);

    return startOfWeek
}

const getEndOfWeek = async (startOfWeek: Date): Promise<Date> => {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 7);

    return endOfWeek;
}

interface IWeekBoundries {
    day: number,
    monday: number
}

const getWeekBoundries = async (): Promise<IWeekBoundries> => {
    const day = new Date().getUTCDay();
    const monday = 1;

    return { day, monday };
}