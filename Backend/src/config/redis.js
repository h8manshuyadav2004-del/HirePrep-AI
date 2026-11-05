const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTls = redisUrl.startsWith('rediss://');

const redisClient = createClient({
    url: redisUrl,
    pingInterval: 30000,
    socket: {
        tls: isTls ? true : undefined,
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
            if (retries > 5) return false;
            return Math.min(retries * 200, 3000);
        }
    }
});

redisClient.on('error', (err) => {
    console.warn('⚠️ Redis Notice (Handled):', err.message || err.code);
});

redisClient.on('reconnecting', () => console.log('Redis client is reconnecting...'));
redisClient.on('ready', () => console.log('Connected to Redis successfully!'));

// Start connecting without making Redis availability a prerequisite for server startup.
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn('Redis connection failed; continuing without Redis:', err.message || err.code);
    }
})().catch((err) => {
    console.warn('Redis connection setup failed; continuing without Redis:', err.message || err.code);
});

module.exports = redisClient;
