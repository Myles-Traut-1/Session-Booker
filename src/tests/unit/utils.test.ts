import { normalizeDateToMidnightUTC } from "../../utils/utils";

describe("Normalize date", () => {
    it("should normalize the date correctly", () => {
        const d = new Date("2026-09-17T15:42:30.123Z");

        const normalizedDate = normalizeDateToMidnightUTC(d);

        console.log(normalizedDate);
        expect(normalizedDate.toISOString()).toMatch(/00:00:00.000/);
    });
});