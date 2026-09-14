import { Request, Response, NextFunction } from "express";

export default function(err: unknown, req: Request, res: Response, next: NextFunction) {
    // LOG THE ERROR
    console.error(err);

    // RETURN STATUS AND MESSAGE
    res.status(500).send("An error occured fetching data...")
}