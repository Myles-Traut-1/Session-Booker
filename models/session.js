const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: [true, "You must provide a valid booking date"],
        min: [new Date.setHours(0,0,0,0), 'Booking date cannot be in the past']
    },
    timeSlot: {
        type: String,
        required: [true, "booking date is required"],
        enum: {
            values: [
                "08:00", "09:00", "10:00", "11:00", "12:00",
                "13:00", "14:00", "15:00", "16:00" 
            ],
            message: "Booking slots are hourly between 8am and 4pm"
        }
    }
});

const Session = mongoose.model("Session", sessionSchema);

exports.Session = Session;