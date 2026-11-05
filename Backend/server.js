require("dotenv").config();
const connectToDB = require("./src/config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToDB();
        console.log("Connected to MongoDB successfully!");

        // Requiring the app initializes Redis; its connection is handled asynchronously.
        const app = require("./src/app");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server due to database error:", error);
        process.exit(1);
    }
}

startServer();
