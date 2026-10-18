import "dotenv/config";

import app from "./app.js";
import database from "./config/database.js";
import "./models/index.js"; // registers model associations

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await database.authenticate();
        await database.sync({ alter: true });
        console.log("Database connected.");

        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

start();
