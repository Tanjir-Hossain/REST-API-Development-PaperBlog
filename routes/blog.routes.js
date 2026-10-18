import { Router } from "express";

import {
    listBlogs,
    getBlog,
    createBlog,
    updateBlog,
    deleteBlog
} from "../controllers/blog.controller.js";
import authenticate from "../middlewares/authenticate.js";

const router = Router();

// Public — no token required
router.get("/", listBlogs);
router.get("/:id", getBlog);

// Protected — user or admin
router.post("/create", authenticate, createBlog);
router.put("/update/:id", authenticate, updateBlog);
router.delete("/delete/:id", authenticate, deleteBlog);

export default router;
