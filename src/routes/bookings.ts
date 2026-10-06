import express, { type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";

import { Booking, type IBooking } from "../models/bookings";
import { auth, admin } from "../middleware/auth";

import { normalizeDateToMidnightUTC } from "../utils/utils"
import { checkBookingCap, validateBookingRequest, getStartOfWeek, getEndOfWeek  } 
    from "../services/booking-service";

import { AuthResponse } from "../types";

const router = express.Router();

/** -------- GET -------- */

router.get('/details', auth, async(req: Request, res: Response, next: NextFunction) => {
    const id = (req.user as AuthResponse)._id;

    const scope = req.query.scope as string;

    const filter: Record<string, unknown> = { student: id };

    const startOfWeek = await getStartOfWeek();
    const endOfWeek = await getEndOfWeek(startOfWeek);

    if(scope === "current-week" || !scope ) {
        filter.date = { $gte : startOfWeek, $lt: endOfWeek };
    }

    else if (scope === "upcoming") {
        const endOfWeek = await getEndOfWeek(await getStartOfWeek());
        filter.date = { $gte: endOfWeek };
    }

    else if (scope === 'all') {
        // no date filter at all
    }

    else {
        return res.status(400).json({error: "malformed query scope"});
    }

    try {
        const bookings = await Booking.find(filter);

        if(bookings.length === 0) {
            res.status(200).json({message: "No bookings made yet"});
        }

        res.json({data: bookings});
    } catch(err) {
        next(err);
    }
});

/** -------- POST -------- */
/// TODO concurency guard via counter document
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