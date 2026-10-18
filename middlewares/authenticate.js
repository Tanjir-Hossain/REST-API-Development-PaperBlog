import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";

/**
 * Rejects any request that does not carry a valid `Authorization: Bearer <jwt>`
 * header. On success the decoded payload (id, email, role) is attached to
 * req.user for downstream handlers.
 */
const authenticate = (req, _res, next) => {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("No authentication token provided."));
    }

    const token = header.slice("Bearer ".length).trim();

    try {
        req.user = verifyToken(token);
        return next();
    } catch {
        return next(ApiError.unauthorized("Invalid or expired token."));
    }
};

export default authenticate;
