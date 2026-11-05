const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTls = redisUrl.startsWith('rediss://');

const redisClient = createClient({
    url: redisUrl,
    pingInterval: 300000,
    socket: {
        tls: isTls ? true : undefined,
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
            if (retries > 10) return false;
            return Math.min(retries * 200, 3000);
        }
    }
});

redisClient.on('error', (err) => {
    if (err.message !== 'Socket closed unexpectedly') {
        console.error('Redis Client Error:', err.message);
    }
});

redisClient.on('reconnecting', () => console.log('Redis client is reconnecting...'));
redisClient.on('ready', () => console.log('Connected to Redis successfully!'));

// Start connecting without making Redis availability a prerequisite for server startup.
redisClient.connect().catch((err) => {
    console.warn('Redis could not connect. Continuing without Redis:', err.message);
});

module.exports = redisClient;
