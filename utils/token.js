import jwt from "jsonwebtoken";

/**
 * Builds a signed JWT containing just enough to authorise later requests:
 * the user id, email and role. Never put the password or other secrets here.
 */
export const issueToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
};

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
