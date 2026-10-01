import express, { type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";

import { Booking } from "../models/bookings";
import { auth, admin } from "../middleware/auth";

import { normalizeDateToMidnightUTC } from "../utils/utils"
import { checkBookingCap, validateBookingRequest } from "../services/booking-service";

import { AuthResponse } from "../types";

const router = express.Router();

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