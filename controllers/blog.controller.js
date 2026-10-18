import { Op } from "sequelize";

import { Blog, User } from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import { isBlank, isValidId } from "../validators/index.js";

// Author fields that are safe to expose on public blog responses.
const AUTHOR_FIELDS = ["id", "firstname", "lastname", "profileImage"];
const BLOG_FIELDS = ["id", "blogTitle", "blog", "category", "userId", "createAt", "updateAt"];

/* -------------------------------------------------------------------------- */
/*  Public                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/blogs
 * Optional query filters:
 *   ?title=<text>      partial, case-insensitive match on blogTitle
 *   ?category=<text>   exact category match
 * Both may be combined.
 */
export const listBlogs = asyncHandler(async (req, res) => {
    const { title, category } = req.query;
    const where = {};

    if (!isBlank(title)) {
        where.blogTitle = { [Op.like]: `%${title.trim()}%` };
    }

    if (!isBlank(category)) {
        where.category = category.trim();
    }

    const blogs = await Blog.findAll({
        where,
        attributes: BLOG_FIELDS,
        include: [{ model: User, as: "author", attributes: AUTHOR_FIELDS }],
        order: [["createAt", "DESC"]]
    });

    return sendResponse(res, 200, "Blogs retrieved.", blogs);
});

/** GET /api/blogs/:id */
export const getBlog = asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) {
        throw ApiError.badRequest("Invalid blog id.");
    }

    const blog = await Blog.findByPk(req.params.id, {
        attributes: BLOG_FIELDS,
        include: [{ model: User, as: "author", attributes: AUTHOR_FIELDS }]
    });

    if (!blog) {
        throw ApiError.notFound("Blog not found.");
    }

    return sendResponse(res, 200, "Blog retrieved.", blog);
});

/* -------------------------------------------------------------------------- */
/*  Authenticated (user / admin)                                              */
/* -------------------------------------------------------------------------- */

/** POST /api/blogs/create */
export const createBlog = asyncHandler(async (req, res) => {
    const { blogTitle, blog, category } = req.body;

    if (isBlank(blogTitle) || isBlank(blog) || isBlank(category)) {
        throw ApiError.badRequest("blogTitle, blog and category are required.");
    }

    // The owner always comes from the token, never from the request body.
    const created = await Blog.create({
        userId: req.user.id,
        blogTitle: blogTitle.trim(),
        blog,
        category: category.trim()
    });

    return sendResponse(res, 201, "Blog created successfully.", created);
});

/**
 * Loads a blog and confirms the caller may modify it.
 * Owners may touch their own posts; admins may touch anyone's.
 */
const loadEditableBlog = async (paramId, requester) => {
    if (!isValidId(paramId)) {
        throw ApiError.badRequest("Invalid blog id.");
    }

    const blog = await Blog.findByPk(paramId);
    if (!blog) {
        throw ApiError.notFound("Blog not found.");
    }

    const isOwner = blog.userId === requester.id;
    const isAdmin = requester.role === "admin";
    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden("You are not authorized to modify this blog.");
    }

    return blog;
};

/** PUT /api/blogs/update/:id */
export const updateBlog = asyncHandler(async (req, res) => {
    const blog = await loadEditableBlog(req.params.id, req.user);

    const { blogTitle, blog: content, category } = req.body;
    if (isBlank(blogTitle) || isBlank(content) || isBlank(category)) {
        throw ApiError.badRequest("blogTitle, blog and category are required.");
    }

    await blog.update({
        blogTitle: blogTitle.trim(),
        blog: content,
        category: category.trim()
    });

    return sendResponse(res, 200, "Blog updated successfully.", blog);
});

/** DELETE /api/blogs/delete/:id */
export const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await loadEditableBlog(req.params.id, req.user);
    await blog.destroy();

    return sendResponse(res, 200, "Blog deleted successfully.");
});
