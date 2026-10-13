import express, { type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";

import { Booking } from "../models/bookings";
import { WeeklyBookingCount, type IWeeklyBookingCount } from "../models/booking-count";
import { auth, admin } from "../middleware/auth";

import { normalizeDateToMidnightUTC } from "../utils/utils"
import { 
    validateBookingRequest, 
    validateUpdateBookingRequest, 
    getStartOfWeek, 
    getEndOfWeek, 
    parseQueryPageParams,  
    parseQueryScope 
} from "../services/booking-service";

import { AuthResponse } from "../types";

const router = express.Router();

/** -------- CONSTANTS -------- */
const BOOKINGS_PAGE_SIZE = 20; 

/** -------- CUSTOM ERROR CLASS -------- */
class WeeklyCapReachedError extends Error {}
class BookingNotFound extends Error {}

/** -------- GET -------- */

router.get('/details', auth, async(req: Request, res: Response, next: NextFunction) => {
    const id = (req.user as AuthResponse)._id;

    const scope = parseQueryScope(req.query.scope);

    const page = parseQueryPageParams(req.query.page);
    const skip = (page - 1) * BOOKINGS_PAGE_SIZE;

    const filter: Record<string, unknown> = { student: id };

    let startOfWeek: Date = await getStartOfWeek(new Date());
    let endOfWeek: Date = await getEndOfWeek(startOfWeek);

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

    const startOfWeek = await getStartOfWeek(normalizedBookingDate);

    const session = await mongoose.startSession();

    try {
        const booking = await session.withTransaction(async() => {
            /**
             * 2 Step Concurrency Guard
             * Step 1: Check if weeklyCounter Doc exists. If not create it.
             * Step 2: Increment counter.
            */
            
            await WeeklyBookingCount.findOneAndUpdate({
                studentId : id,
                weekStart: startOfWeek
            }, 
            {
                $setOnInsert: {weeklyCount: 0}
            },
            {
                session, 
                upsert: true
            },
            );

            const weeklyBookingDoc: IWeeklyBookingCount | null = await WeeklyBookingCount.findOneAndUpdate({
                studentId : id,
                weekStart: startOfWeek,
                weeklyCount: {$lt: 3}}, 
                {$inc: {
                        weeklyCount: 1
                }},
                {session, returnDocument: "after"},
            );

            if(weeklyBookingDoc === null) {
                throw new WeeklyCapReachedError();
            }

            const [created] = await Booking.create([{
                student: id,
                date: normalizedBookingDate,
                slotIndex: req.body.slotIndex
            }], {session});

            return created;
        });

        return res.status(200).json({data: booking});

    } catch(err) {
        if (err instanceof WeeklyCapReachedError) {
            return res.status(409).json({ error: "Weekly Booking Cap Reached" });
        }
        next(err);
    } finally {
        await session.endSession();
    }
});

/** -------- PUT -------- */
router.put("/:id", auth, async(req: Request, res: Response, next: NextFunction) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
        return res.status(400).json({error: "Invalid Id"});
    }

    const { error } = validateUpdateBookingRequest(req.body);
    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }

    const studentId = (req.user as AuthResponse)._id;

    const normalizedCurrentBookingDate = normalizeDateToMidnightUTC(req.body.currentDate);
    const normalizedUpdatedBookingDate = normalizeDateToMidnightUTC(req.body.newDate);

    if(normalizedCurrentBookingDate.getUTCDay() === 0 || normalizedCurrentBookingDate.getUTCDay() === 6) {
        return res.status(400).json({error: "No Bookings on Weekends"});
    }
    /// HERE
    try {
        let currentBooking = await Booking.findOne({
            _id: req.params.id,
            student: studentId,
            date: normalizedCurrentBookingDate
        });

        if(!currentBooking) {
            throw new BookingNotFound();
        }
        
        //res.json({data: updatedBooking});

    } catch(err) {
        if( err instanceof BookingNotFound) {
            return res.status(404).json({ error: "Booking Not Found" });
        }
        next(err);
    }
});

export default router;