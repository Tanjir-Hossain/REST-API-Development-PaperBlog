import crypto from "crypto";

import bcrypt from "bcryptjs";

import { User } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { issueToken } from "../utils/token.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

const hashResetToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

/**
 * Creates a new account. The role is hard-coded to "user" here on purpose —
 * a client can never promote itself to admin through registration.
 */
export const createAccount = async ({ firstname, lastname, email, password }) => {
    const normalisedEmail = email.trim().toLowerCase();

    const alreadyExists = await User.findOne({ where: { email: normalisedEmail } });
    if (alreadyExists) {
        throw ApiError.conflict("An account with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: normalisedEmail,
        password: hashedPassword,
        role: "user",
        isActive: true
    });

    // Return a plain object without the password hash.
    return {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profileImage: user.profileImage
    };
};

/**
 * Verifies credentials and returns a signed token plus the safe user object.
 * Deactivated accounts are refused even with a correct password.
 */
export const authenticateUser = async ({ email, password }) => {
    const normalisedEmail = email.trim().toLowerCase();

    // withPassword scope is required so bcrypt has a hash to compare against.
    const user = await User.scope("withPassword").findOne({
        where: { email: normalisedEmail }
    });

    if (!user) {
        throw ApiError.unauthorized("Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        throw ApiError.unauthorized("Invalid email or password.");
    }

    if (!user.isActive) {
        throw ApiError.forbidden("This account has been deactivated.");
    }

    return {
        token: issueToken(user),
        user: {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            profileImage: user.profileImage
        }
    };
};

/**
 * Starts the "forgot password" flow. A random token is generated; only its
 * SHA-256 hash is stored, together with a short expiry. To keep the endpoint
 * from revealing which emails are registered, the same generic message is
 * returned whether or not the account exists.
 *
 * A real deployment would email the reset link. Since mail delivery is out of
 * scope for this project, the raw token is returned in the response (dev only)
 * so the reset page can be tested end to end.
 */
export const beginPasswordReset = async ({ email }) => {
    const normalisedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalisedEmail } });

    const genericMessage =
        "If an account exists for that email, a password reset link has been sent.";

    if (!user) {
        return { message: genericMessage };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    user.resetTokenHash = hashResetToken(rawToken);
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const payload = { message: genericMessage };

    // Expose the token only outside production so the flow is testable locally.
    if (process.env.NODE_ENV !== "production") {
        payload.resetToken = rawToken;
        payload.resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${rawToken}`;
    }

    return payload;
};

/**
 * Completes the flow: validates the token against the stored hash and expiry,
 * sets the new password and clears the one-time token.
 */
export const completePasswordReset = async ({ token, password }) => {
    if (!token) {
        throw ApiError.badRequest("A reset token is required.");
    }

    const user = await User.scope("withResetToken").findOne({
        where: { resetTokenHash: hashResetToken(token) }
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
        throw ApiError.badRequest("This reset link is invalid or has expired.");
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();
};
