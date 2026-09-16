import jwt from "jsonwebtoken";
import config from "config";
import { type Request, type Response, type NextFunction } from "express";
import { type AuthResponse } from "../types"

const auth = (req: Request, res: Response, next: NextFunction) => {
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

const admin = (req: Request, res: Response, next: NextFunction) => {
    if(!req.user) {
        return res.status(401).json({error: "No token provided"});
    }

    if(req.user.role !== "admin") {
        return res.status(403).json({error: "Access Denied"});
    }

    next();
}

export {auth, admin}