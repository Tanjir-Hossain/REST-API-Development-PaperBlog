import {
    createAccount,
    authenticateUser,
    beginPasswordReset,
    completePasswordReset
} from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import { isBlank, isValidEmail, isStrongEnough } from "../validators/index.js";

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    if (isBlank(firstname) || isBlank(lastname) || isBlank(email) || isBlank(password)) {
        throw ApiError.badRequest("Firstname, lastname, email and password are all required.");
    }

    if (!isValidEmail(email)) {
        throw ApiError.badRequest("Please provide a valid email address.");
    }

    if (!isStrongEnough(password)) {
        throw ApiError.badRequest("Password must be at least 6 characters long.");
    }

    const user = await createAccount({ firstname, lastname, email, password });

    return sendResponse(res, 201, "Registration successful.", user);
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (isBlank(email) || isBlank(password)) {
        throw ApiError.badRequest("Email and password are required.");
    }

    const result = await authenticateUser({ email, password });

    return sendResponse(res, 200, "Login successful.", result);
});

/** POST /api/auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (isBlank(email) || !isValidEmail(email)) {
        throw ApiError.badRequest("Please provide a valid email address.");
    }

    const result = await beginPasswordReset({ email });

    return sendResponse(res, 200, result.message, {
        resetToken: result.resetToken,
        resetUrl: result.resetUrl
    });
});

/** PATCH /api/auth/reset-password/:token */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!isStrongEnough(password)) {
        throw ApiError.badRequest("Password must be at least 6 characters long.");
    }

    await completePasswordReset({ token, password });

    return sendResponse(res, 200, "Password successfully changed.");
});
