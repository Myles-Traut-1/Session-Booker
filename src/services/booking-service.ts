import mongoose from "mongoose"
import Joi from "joi";

import { Booking } from "../models/bookings"
import { normalizeDateToMidnightUTC } from "../utils/utils"

/** ------ INTERFACES ------ */

interface IWeekBoundries {
    day: number,
    monday: number
}

interface IBookingRequest {
    date: string,
    time: string
}

/** ------ VALIDATION ------ */

const validateBookingRequest = (booking: IBookingRequest) => {
    const schema = Joi.object({
        date: Joi.string().isoDate().required(),
        slotIndex: Joi.number().min(0).max(8).required()
    })

    return schema.validate(booking);
}

/** ------ HELPERS ------ */

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

const getWeekBoundries = async (): Promise<IWeekBoundries> => {
    const day = new Date().getUTCDay();
    const monday = 1;

    return { day, monday };
}

/** ------ EXPORTS ------ */

export { 
    checkBookingCap, 
    validateBookingRequest, 
    getStartOfWeek, 
    getEndOfWeek 
}