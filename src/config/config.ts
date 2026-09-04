import config from "config";

/// TODO: Validate all config variables.

export default function() {
    try{
        const value = config.get("jwtPrivateKey");
        if(!value) {
            throw new Error("jwt PK cannot be empty string");
        } 
    } catch( err ) {
        const reason = err instanceof Error ? err.message : 'unknown error';
        throw new Error(`FATAL ERROR: invalid config - ${reason}`)
    }
}
