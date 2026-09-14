import jwt from "jsonwebtoken";
import config from "config";
import { type Request, type Response, type NextFunction } from "express";
import { type AuthResponse } from "../types"

export default function auth(req: Request, res: Response, next: NextFunction) {
    const token = req.header('x-auth-token');
    if(!token) {
        return res.status(401).json({error: "No token provided"})
    }
    
    try {
        const decoded = jwt.verify(token, config.get("jwtPrivateKey")) as AuthResponse;

        req.user = decoded;

        next();
    } catch(err) {
        next(err);
    }    
}