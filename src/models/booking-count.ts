import mongoose, { type Document } from "mongoose";

interface IWeeklyBookingCount extends Document {
    studentId: mongoose.Types.ObjectId,
    weekStart: Date,
    weeklyCount: number
}

const weeklyBookingCountSchema = new mongoose.Schema<IWeeklyBookingCount>({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    weekStart: {
        type: Date,
        required: true
    },
    weeklyCount: {
        type: Number,
        required: true,
    }
});

weeklyBookingCountSchema.index(
    {studentId: 1, weekStart: 1}, 
    {unique: true}
);

const WeeklyBookingCount = mongoose.model<IWeeklyBookingCount>("WeeklyBookingCount", weeklyBookingCountSchema);

export {
    WeeklyBookingCount,
    type IWeeklyBookingCount
}
