import {parseQueryScope, parseQueryPageParams } from "../../services/booking-service";

describe("parseQueryPageParams", () => {
    it("should return 1 if query not a string", () => {
        const queryBool = true;

        const val = parseQueryPageParams(queryBool);

        expect(val).toEqual(1);
    });
    it("should return 1 if formatted query not a number", () => {
        const queryString = "banana";

        const val = parseQueryPageParams(queryString);

        expect(val).toEqual(1);
    });
    it("should return 1 if query is a negative number", () => {
        const queryString = "-5";

        const val = parseQueryPageParams(queryString);

        expect(val).toEqual(1);
    });
    it("should return the formatted query for a valid input", () => {
        const queryString = "5";

        const val = parseQueryPageParams(queryString);

        expect(val).toEqual(5);
    });
});

describe("parseQueryScope", () => {
    it("should return current-week if query scope not a string", () => {
        const invalidScope = 5;
        const val = parseQueryScope(invalidScope);

        expect(val).toMatch(/current-week/);
    });
    it("should return the query scope for all other string values", () => {
        const scope = "banana";
        const val = parseQueryScope(scope);

        expect(val).toMatch(/banana/);
    });
});