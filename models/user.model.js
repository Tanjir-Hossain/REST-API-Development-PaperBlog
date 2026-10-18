import { DataTypes } from "sequelize";
import database from "../config/database.js";

/**
 * User account.
 *
 * The password column is excluded from every query by default through
 * `defaultScope`, so a hashed password can never accidentally leak through an
 * API response. The auth layer pulls it in explicitly with the
 * `withPassword` scope when it needs to verify a login.
 */
const User = database.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        firstname: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        lastname: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        profileImage: {
            // Relative path to the uploaded avatar, e.g. "/uploads/profile/..".
            // Null means the client should fall back to a default avatar.
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        resetTokenHash: {
            // Hash of the active password-reset token (null when none is live).
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        resetTokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        role: {
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
            defaultValue: "user"
        }
    },
    {
        tableName: "users",
        timestamps: true,
        createdAt: "createAt",
        updatedAt: "updateAt",
        defaultScope: {
            // Secrets are stripped from every ordinary query so they can never
            // leak through an API response.
            attributes: { exclude: ["password", "resetTokenHash", "resetTokenExpiresAt"] }
        },
        scopes: {
            withPassword: {
                attributes: { include: ["password"] }
            },
            // Pulls the reset-token columns back in for the reset flow only.
            withResetToken: {
                attributes: { include: ["resetTokenHash", "resetTokenExpiresAt"] }
            }
        }
    }
);

export default User;
