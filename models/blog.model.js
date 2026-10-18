import { DataTypes } from "sequelize";
import database from "../config/database.js";

/**
 * Blog post. Each post belongs to the user who created it; the owner link is
 * declared in models/index.js where the associations live.
 */
const Blog = database.define(
    "Blog",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        blogTitle: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        blog: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    },
    {
        tableName: "blogs",
        timestamps: true,
        createdAt: "createAt",
        updatedAt: "updateAt"
    }
);

export default Blog;
