import multer from "multer";
import path from "path";
import fs from "fs";

import ApiError from "../utils/ApiError.js";

/*
 * Avatar uploads are written to /uploads/profile and served statically by the
 * app. Only small image files are accepted; everything else is rejected before
 * it ever touches disk.
 */
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile");
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, unique);
    }
});

const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okType = ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext);

    if (!okType) {
        return cb(ApiError.badRequest("Only JPG, PNG and WEBP images are allowed."));
    }

    return cb(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

export default uploadAvatar;
