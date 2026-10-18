import { Sequelize } from "sequelize";
import "dotenv/config";

/**
 * Single shared Sequelize instance for the whole application.
 * Every model imports this connection.
 */
const database = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        dialect: "mysql",
        logging: false
    }
);

export const testConnection = async () => {
    await database.authenticate();
};

export default database;
