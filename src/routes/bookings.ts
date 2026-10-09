import express, { type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";

import { Booking, type IBooking } from "../models/bookings";
import { WeeklyBookingCount, type IWeeklyBookingCount } from "../models/booking-count";
import { auth, admin } from "../middleware/auth";

import { normalizeDateToMidnightUTC } from "../utils/utils"
import { validateBookingRequest, getStartOfWeek, getEndOfWeek, parseQueryPageParams,  parseQueryScope } 
    from "../services/booking-service";

import { AuthResponse } from "../types";

const router = express.Router();

const BOOKINGS_PAGE_SIZE = 20; 


/** -------- GET -------- */

router.get('/details', auth, async(req: Request, res: Response, next: NextFunction) => {
    const id = (req.user as AuthResponse)._id;

    const scope = parseQueryScope(req.query.scope);

    const page = parseQueryPageParams(req.query.page);
    const skip = (page - 1) * BOOKINGS_PAGE_SIZE;

    const filter: Record<string, unknown> = { student: id };

    const startOfWeek = await getStartOfWeek();
    const endOfWeek = await getEndOfWeek(startOfWeek);

    if(scope === "current-week" || !scope ) {
        filter.date = { $gte : startOfWeek, $lt: endOfWeek };
    }

    else if (scope === "upcoming") {
        filter.date = { $gte: endOfWeek };
    }

    else if (scope === 'all') {
        // no date filter at all
    }

    else {
        return res.status(400).json({error: "malformed query scope"});
    }

    try {
        const [bookings, totalCount] = await Promise.all([Booking.find(filter).sort({date: 1}).skip(skip).limit(BOOKINGS_PAGE_SIZE),
            Booking.countDocuments(filter)
        ]);

        if(bookings.length === 0) {
            return res.status(200).json({message: "No bookings made yet"});
        }

        res.json({
            data: bookings,
            pagination: {
                page,
                pageSize: BOOKINGS_PAGE_SIZE,
                totalCount,
                totalPages: Math.ceil(totalCount / BOOKINGS_PAGE_SIZE) 
            }
        });
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

        const startOfWeek = await getStartOfWeek();

        /**
         * Concurrency Guard
         * Spilt in two steps to prevent triggering Mongo Duplicate Key Error on counter > 3  
        */
        
        // Step 1: Check if weeklyCounter Doc exists. If not create it. 
        await WeeklyBookingCount.findOneAndUpdate({
            studentId : id,
            weekStart: startOfWeek
        }, 
        {
            $setOnInsert: {weeklyCount: 0}
        },
        {
            session, returnDocument: "after", upsert: true
        },
        );

        // Step 2: Increment counter.
        let weeklyBookingDoc: IWeeklyBookingCount | null = await WeeklyBookingCount.findOneAndUpdate({
            studentId : id,
            weekStart: startOfWeek,
            weeklyCount: {$lt: 3}}, 
            {$inc: {
                    weeklyCount: 1
            }},
            {session, returnDocument: "after"},
        );

        if(weeklyBookingDoc === null) {
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