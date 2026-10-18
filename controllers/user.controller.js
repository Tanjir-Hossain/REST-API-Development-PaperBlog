import fs from "fs";
import path from "path";

import bcrypt from "bcryptjs";

import { User } from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import { isBlank, isStrongEnough, isValidId } from "../validators/index.js";

/* -------------------------------------------------------------------------- */
/*  Admin-only                                                                */
/* -------------------------------------------------------------------------- */

/** GET /api/users */
export const listUsers = asyncHandler(async (_req, res) => {
    const users = await User.findAll({ order: [["id", "ASC"]] });
    return sendResponse(res, 200, "Users retrieved.", users);
});

/** GET /api/users/:id */
export const getUser = asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) {
        throw ApiError.badRequest("Invalid user id.");
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    return sendResponse(res, 200, "User retrieved.", user);
});

/** PATCH /api/users/:id/status */
export const setUserStatus = asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) {
        throw ApiError.badRequest("Invalid user id.");
    }

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
        throw ApiError.badRequest("Field 'isActive' must be true or false.");
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    await user.update({ isActive });

    return sendResponse(
        res,
        200,
        isActive ? "User activated." : "User deactivated.",
        { id: user.id, isActive: user.isActive }
    );
});

/* -------------------------------------------------------------------------- */
/*  Authenticated user (self-service)                                         */
/* -------------------------------------------------------------------------- */

/** GET /api/users/profile */
export const getMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    return sendResponse(res, 200, "Profile retrieved.", user);
});

/** PUT /api/users/profile/update */
export const updateMyProfile = asyncHandler(async (req, res) => {
    const { firstname, lastname } = req.body;

    if (isBlank(firstname) || isBlank(lastname)) {
        throw ApiError.badRequest("Firstname and lastname are required.");
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    // Only name fields are writable here — role, isActive and email are
    // deliberately ignored so a normal user cannot escalate privileges.
    await user.update({
        firstname: firstname.trim(),
        lastname: lastname.trim()
    });

    return sendResponse(res, 200, "Profile updated.", user);
});

/** PATCH /api/users/password */
export const updateMyPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!isStrongEnough(password)) {
        throw ApiError.badRequest("Password must be at least 6 characters long.");
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw ApiError.notFound("User not found.");
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return sendResponse(res, 200, "Password updated successfully.");
});

/**
 * PATCH /api/users/profile/image
 * Accepts a single multipart `image` field (handled by the upload middleware)
 * and stores its public path on the user. The previous avatar file, if any, is
 * removed from disk so uploads do not accumulate.
 */
export const updateMyProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw ApiError.badRequest("An image file is required.");
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        // Clean up the just-saved file before bailing out.
        fs.promises.unlink(req.file.path).catch(() => {});
        throw ApiError.notFound("User not found.");
    }

    // Remove the old avatar so the uploads folder stays tidy.
    if (user.profileImage) {
        const previous = path.join(process.cwd(), user.profileImage.replace(/^\/+/, ""));
        fs.promises.unlink(previous).catch(() => {});
    }

    const publicPath = `/uploads/profile/${req.file.filename}`;
    await user.update({ profileImage: publicPath });

    return sendResponse(res, 200, "Profile image updated.", {
        id: user.id,
        profileImage: user.profileImage
    });
});
