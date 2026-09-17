import mongoose, { type Document }from "mongoose";
import jwt from "jsonwebtoken";
import config from "config"

type UserRole = "admin" | "student";

interface IUser extends Document {
    name: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    createdAt: Date,
    updatedAt: Date,
    generateAuthToken: () => string
}

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
        trim: true
    },
    email: {
        type:String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 255,
        match: [/.*@.*/, "email must contain @ sign"],
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ["admin", "student"],
        default: "student",
        required: true
    }
}, { timestamps: true });

userSchema.methods.generateAuthToken = function(this: IUser) {
    const token = jwt.sign({_id: this._id, role: this.role}, config.get("jwtPrivateKey") as string);
    return token;
}

export const User = mongoose.model<IUser>("User", userSchema);
export type { IUser, UserRole };

