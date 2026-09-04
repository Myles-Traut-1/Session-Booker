import config from 'config';
import validateConfig from '../../../src/config/config';

jest.mock('config', () => {
    return {
        get: jest.fn()
    }
});

describe("validateConfig", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should throw if jwtPrivateKey missing", () => {
       (config.get as jest.Mock).mockImplementation(() => {
            throw new Error('Configuration Property "jwtPrivateKey" not defined');
       });

       expect(() => validateConfig()).toThrow(/FATAL ERROR: invalid config/);
    });
    it("should throw if jwtPrivateKey is empty string", () => {
       (config.get as jest.Mock).mockReturnValue("");

       expect(() => validateConfig()).toThrow(/FATAL ERROR: invalid config/);
    });
    it("should throw unknown error for anything else", () => {
       (config.get as jest.Mock).mockImplementation(() => {
            throw(42);
       });

       expect(() => validateConfig()).toThrow(/unknown error/);
    });
    it("should not throw if valid jwtPrivateKey", () => {
       (config.get as jest.Mock).mockReturnValue("super-secret-key");

       expect(() => validateConfig()).not.toThrow();
    });
});