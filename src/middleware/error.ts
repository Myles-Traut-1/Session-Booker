import { Request, Response, NextFunction } from "express";
import { MongoServerError } from 'mongodb';
import jwt from "jsonwebtoken";

export default function (err: unknown, req: Request, res: Response, next: NextFunction) {
    console.error(err);

    if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (err instanceof MongoServerError && err.code === 11000) {
        return res.status(409).json({ error: "That slot was just booked by someone else" });
    }

    const message = err instanceof Error ? err.message : "An error occurred";
    res.status(500).json({ error: message });
}