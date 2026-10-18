/**
 * Tiny, dependency-free validation helpers shared across controllers.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isBlank = (value) =>
    value === undefined || value === null || String(value).trim() === "";

export const isValidEmail = (email) =>
    typeof email === "string" && EMAIL_PATTERN.test(email.trim());

/** Passwords need a reasonable minimum length; there is no upper cap. */
export const isStrongEnough = (password) =>
    typeof password === "string" && password.trim().length >= 6;

/** Route params arrive as strings, so confirm a clean positive integer id. */
export const isValidId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0;
};
