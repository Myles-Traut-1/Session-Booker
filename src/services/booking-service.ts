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
    slotIndex: string
}

interface IUpdateBookingRequest {
    currentDate: string,
    newDate: string,
    slotIndex: string
}

/** ------ VALIDATION ------ */

const validateBookingRequest = (booking: IBookingRequest) => {
    const schema = Joi.object({
        date: Joi.string().isoDate().required(),
        slotIndex: Joi.number().min(0).max(8).required()
    })

    return schema.validate(booking);
}

const validateUpdateBookingRequest = (bookingUpdate: IUpdateBookingRequest) => {
    const schema = Joi.object({
        currentDate: Joi.string().isoDate().required(),
        newDate: Joi.string().isoDate().required(),
        slotIndex: Joi.number().min(0).max(8).required()
    })

    return schema.validate(bookingUpdate);
}

/** ------ HELPERS ------ */

const getStartOfWeek = async (date: Date): Promise<Date> =>  {
    // returns numbers 0 - 6 representing days o the week. Sunday = 0. Saturday = 6
    const { monday, day } = await getWeekBoundries();

    // How many days since today was the last monday. 
    // If Sunday, then it was 6 days since the last Monday
    const daysToCheck = day === 0 ? 6 : day - monday;

    const  startOfWeek = normalizeDateToMidnightUTC(date);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysToCheck);

    return startOfWeek
}

const getEndOfWeek = async (startOfWeek: Date): Promise<Date> => {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 7);

    return endOfWeek;
}

const getWeekBoundries = async (): Promise<IWeekBoundries> => {
    // 0 -> 6 = Sun -> Sat
    const day = new Date().getUTCDay();
    const monday = 1;

    return { day, monday };
}

const parseQueryPageParams = (query: unknown): number => {
    const defaultPage: number = 1;

    if (typeof query !== "string") {
        return defaultPage;
    }

    const formattedQuery = parseInt(query);

    if (Number.isNaN(formattedQuery)) {
        return defaultPage;
    }

    if (formattedQuery <= 0) {
        return defaultPage;
    }

    return formattedQuery;
}

const parseQueryScope = (queryScope: unknown): string => {
    if (typeof queryScope !== "string") {
        return "current-week";
    }

    return queryScope;
}

/** ------ EXPORTS ------ */

export {
    validateBookingRequest,
    validateUpdateBookingRequest,
    getStartOfWeek, 
    getEndOfWeek,
    parseQueryPageParams,
    parseQueryScope
}