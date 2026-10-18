import path from "path";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Uploaded avatars are served as static files. The cross-origin header lets
// the Next.js frontend (a different origin) embed them in <img> tags.
app.use(
    "/uploads",
    (_req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
    },
    express.static(path.join(process.cwd(), "uploads"))
);

// Health check
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Blog Management API is up and running."
    });
});

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);

// Fallbacks (keep these last)
app.use(notFound);
app.use(errorHandler);

export default app;
