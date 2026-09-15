import { type Request, type Response } from "express";

import auth from "../../middleware/auth";
import errorMiddleware from "../../middleware/error";

import jsonwebtoken from "jsonwebtoken";

jest.mock('jsonwebtoken', () => {
    return {
        verify: jest.fn()
    }
});

describe("auth middleware", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it("should call next with an error when token verification fails", () => {
        (jsonwebtoken.verify as jest.Mock).mockImplementation(() => {
             throw new Error("JWT Error");
        });
        
        const req = {
            header: jest.fn().mockReturnValue("some-token")
        } as Partial<Request> as Request;
        
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as Partial<Response> as Response;

        const next = jest.fn();

        auth(req, res, next);

        // Just assert is was called with an Error. We do not need to check for the mocked error
        // That would belong in an integration test 
        expect(next).toHaveBeenCalledWith(expect.any(Error)); 
    });
    it("should call next without args on successful verification", () => {
        (jsonwebtoken.verify as jest.Mock).mockImplementation(() => {
            return {_id: "1", role: "student"}
        });
        
        const req = {
            header: jest.fn().mockReturnValue("some-token")
        } as Partial<Request> as Request;
        
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as Partial<Response> as Response;

        const next = jest.fn();

        auth(req, res, next);

        expect(next).toHaveBeenCalledWith(); 
        expect(req.user).toEqual({_id: "1", role: "student"});
    });
});