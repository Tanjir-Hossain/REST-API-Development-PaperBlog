import { Router } from "express";

import {
    listUsers,
    getUser,
    setUserStatus,
    getMyProfile,
    updateMyProfile,
    updateMyPassword,
    updateMyProfileImage
} from "../controllers/user.controller.js";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import uploadAvatar from "../middlewares/upload.js";

const router = Router();

/*
 * Self-service routes are declared before "/:id" so that the literal
 * "profile" / "password" paths are matched ahead of the id parameter.
 */
router.get("/profile", authenticate, getMyProfile);
router.put("/profile/update", authenticate, updateMyProfile);
router.patch("/profile/image", authenticate, uploadAvatar.single("image"), updateMyProfileImage);
router.patch("/password", authenticate, updateMyPassword);

// Admin only
router.get("/", authenticate, authorize("admin"), listUsers);
router.get("/:id", authenticate, authorize("admin"), getUser);
router.patch("/:id/status", authenticate, authorize("admin"), setUserStatus);

export default router;
