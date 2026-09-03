import config from "config";

/// TODO: Validate all config variables.

export default function() {
    if(!config.get("jwtPrivateKey")) {
        throw new Error("FATAL ERROR... jwtPrivateKey not set")
    }
}
