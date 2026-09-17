import express, { type Request, type Response} from "express";
import Joi from "joi";

import { Booking, type IBooking } from "../models/bookings";
import { auth, admin } from "../middleware/auth";
import mongoose from "mongoose";

const router = express.Router();

interface IBookingRequest {
    date: string,
    time: string
}

/** -------- POST -------- */
router.post('/', async(req: Request, res: Response) => {
    const { error } = validateBookingRequest(req.body);
    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }

    res.status(200);
});

export default router;

const validateBookingRequest = (booking: IBookingRequest) => {
    const schema = Joi.object({
        date: Joi.string().isoDate().required(),
        slotIndex: Joi.number().min(0).max(8).required()
    })

    return schema.validate(booking);
}