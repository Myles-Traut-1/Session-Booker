import { type Request, type Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import errorMiddleware from "../../../src/middleware/error";

describe("error middleware", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it("should return a 500 status and an error message for generic error", () => {
        const err = new Error("Something Broke");
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as Partial<Response> as Response;

        const next = jest.fn();

        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({error: "Something Broke"});
    });
    it("should return a 401 status and invalid token error for invalid jwt token", () => {
        const err = new JsonWebTokenError("Invalid or expired token");
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as Partial<Response> as Response;

        const next = jest.fn();

        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Invalid or expired token"});
    });
    it("should return a generic error if not intance of Error", () => {
        const err = "Generic Error";
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as Partial<Response> as Response;

        const next = jest.fn();

        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({error: "An error occurred"});
    });
});