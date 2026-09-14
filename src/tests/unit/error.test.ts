import { type Request, type Response } from "express";
import errorMiddleware from "../../../src/middleware/error";

describe("error middleware", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it("should return a 500 status and an error message", () => {
        const err = new Error("Something Broke");
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as Partial<Response> as Response;

        const next = jest.fn();

        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("An error occured fetching data...");
    });
});