import multer from "multer";

import ApiError from "../utils/ApiError.js";

/** 404 fallback for any route that was not matched above. */
export const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

/**
 * Central error handler. Turns ApiErrors and common Sequelize errors into
 * consistent JSON. Must be registered last, after all routes.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE"
                ? "Profile image must be 2 MB or smaller."
                : "The uploaded image could not be processed.";

        return res.status(400).json({ success: false, message });
    }

    if (err?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
            success: false,
            message: "A record with that value already exists."
        });
    }

    if (err?.name === "SequelizeValidationError") {
        return res.status(400).json({
            success: false,
            message: err.errors?.[0]?.message || "Validation failed."
        });
    }

    console.error("Unexpected error:", err);

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};
