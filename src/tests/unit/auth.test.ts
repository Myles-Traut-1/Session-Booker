import { type Request, type Response } from "express";

import { auth,  admin } from "../../middleware/auth";
import { type AuthResponse } from "../../types"

import jsonwebtoken from "jsonwebtoken";

jest.mock('jsonwebtoken', () => {
    return {
        verify: jest.fn()
    }
});
describe("auth and admin middleware", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("auth middleware", () => {
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

    describe("admin middlware", () => {
        it("should return 401 status if no token provided", async () => {
            const req = {

            } as Partial<Request> as Request;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as Partial<Response> as Response;

            const next = jest.fn();

            admin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenLastCalledWith({error: "No token provided"})
        });
        it("should return 403 status if not admin", async () => {
            const user = {_id: "1", role: "student"};

            const req = {
                user: jest.fn().mockReturnValue(user)
            } as unknown as Request;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as Partial<Response> as Response;

            const next = jest.fn();

            admin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({error: "Access Denied"});
        });
        it("should call next on succecful execution", async () => {
            const user: AuthResponse = {_id: "1", role: "admin"};

            const req = {
                user
            } as unknown as Request;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as Partial<Response> as Response;

            const next = jest.fn();

            admin(req, res, next);

            expect(res.status).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith();
        });
    })
});