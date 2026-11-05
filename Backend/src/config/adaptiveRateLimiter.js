const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("./redis");

function createAdaptiveRateLimiter(options) {
    const memoryLimiter = rateLimit({ ...options, store: undefined });
    const redisLimiter = redisClient?.isOpen
        ? rateLimit({
            ...options,
            store: new RedisStore({
                sendCommand: (...args) => {
                    if (!redisClient?.isOpen) {
                        throw new Error("Redis is disconnected");
                    }
                    return redisClient.sendCommand(args);
                }
            })
        })
        : null;

    return (req, res, next) => {
        if (!redisClient?.isOpen || !redisLimiter) {
            return memoryLimiter(req, res, next);
        }

        try {
            return redisLimiter(req, res, (err) => {
                if (err) return memoryLimiter(req, res, next);
                return next();
            });
        } catch (err) {
            return memoryLimiter(req, res, next);
        }
    };
}

module.exports = createAdaptiveRateLimiter;
