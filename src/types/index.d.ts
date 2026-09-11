declare global {
    namespace Express {
        interface Request {
            user? : AuthResponse
        }
    }
}

export interface AuthResponse {
        _id : string; 
        role: "student" | "admin";
    }

export {}