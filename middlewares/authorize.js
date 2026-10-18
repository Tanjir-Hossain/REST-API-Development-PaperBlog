import ApiError from "../utils/ApiError.js";

/**
 * Restricts a route to the given role(s). Must run after `authenticate`,
 * which is what populates req.user.
 *
 *   router.get("/", authenticate, authorize("admin"), handler);
 */
const authorize = (...allowedRoles) => (req, _res, next) => {
    if (!req.user) {
        return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
        return next(ApiError.forbidden("This action requires elevated permissions."));
    }

    return next();
};

export default authorize;
