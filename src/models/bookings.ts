import mongoose, { type Document } from "mongoose";
import { normalizeDateToMidnightUTC } from "../utils/utils";

interface IBooking extends Document {
    student: mongoose.Types.ObjectId,
    date: Date,
    slotIndex: number,
    createdAt: Date,
    updatedAt: Date
}

const bookingSchema = new mongoose.Schema<IBooking>({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true,
        set: normalizeDateToMidnightUTC
    },
    slotIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 8
    },
}, {timestamps: true});

bookingSchema.index({date: 1, slotIndex: 1}, {unique: true});

const Booking = mongoose.model<IBooking>("Booking", bookingSchema);

export { Booking, type IBooking }

