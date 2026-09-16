import request from "supertest";
import { app } from "../../../index";

describe("/health", () => {
    const executeRequest = () => {
        return request(app).get("/health");
    }

    it("should return 200 status", async() => {
        const res = await executeRequest();

        expect(res.status).toBe(200);
    })
});