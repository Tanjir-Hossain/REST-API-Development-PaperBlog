import database from "../config/database.js";
import User from "./user.model.js";
import Blog from "./blog.model.js";

/**
 * Relationships
 * -------------
 * A user writes many blogs; a blog is written by exactly one user.
 * The alias "author" is what public blog responses expose.
 */
User.hasMany(Blog, {
    foreignKey: "userId",
    as: "posts",
    onDelete: "CASCADE"
});

Blog.belongsTo(User, {
    foreignKey: "userId",
    as: "author"
});

export { database, User, Blog };
