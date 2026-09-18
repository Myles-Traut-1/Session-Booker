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
router.post('/', auth, async(req: Request, res: Response, next: NextFunction) => {
    const { error } = validateBookingRequest(req.body);
    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }

    const id = (req.user as AuthResponse)._id;

    /// TODO add check for booking cap and add transaction session to account for race condition
    try{
        const booking = await Booking.create({
            student: id,
            date: normalizeDateToMidnightUTC(req.body.date),
            slotIndex: req.body.slotIndex
        });

        res.status(200).json({data: booking});
    } catch(err) {
       next(err);
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