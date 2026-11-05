const jwt = require("jsonwebtoken");
// REDIS CLIENT FOR BLACKLISTING TOKENS -----BOOM-----
const redisClient = require("../config/redis"); 
const tokenBlacklist = require("../config/tokenBlacklist");

async function authUser(req, res, next) {
    // Guard optional cookie/header objects and accept only a well-formed Bearer header.
    const authorization = typeof req.headers?.authorization === "string"
        ? req.headers.authorization.trim()
        : "";
    const bearerParts = authorization.split(/\s+/);
    const headerToken = bearerParts.length === 2 && /^Bearer$/i.test(bearerParts[0])
        ? bearerParts[1]
        : null;
    const cookieToken = typeof req.cookies?.token === "string" ? req.cookies.token : null;
    const token = cookieToken || headerToken;

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        });
    }

    try {
        // jwt.verify requires a configured secret; fail clearly instead of throwing ambiguously.
        if (!process.env.JWT_SECRET) {
            console.error("Auth Middleware Configuration Error: JWT_SECRET is not configured.");
            return res.status(500).json({ message: "Authentication service is not configured." });
        }

        // Check the in-process blacklist even when Redis is unavailable.
        let isBlacklisted = tokenBlacklist.has(token);
        if (redisClient?.isOpen) {
            try {
                isBlacklisted = Boolean(isBlacklisted || await redisClient.get(`blacklist:${token}`));
            } catch (redisError) {
                // Redis may close after isOpen is checked; warn and continue JWT verification.
                console.warn("Auth Middleware Redis Warning: blacklist lookup failed; continuing token verification.", redisError.message);
                isBlacklisted = tokenBlacklist.has(token);
            }
        }

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Session expired. Please log in again." // Better UX message
            });
        }

        // Verify the JWT only after validating the secret and checking available blacklist stores.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach user payload to request
        req.user = decoded;

        next();

    } catch (err) {
        // Catch blacklist-store and JWT errors so an async middleware failure never escapes Express.
        console.error("Auth Middleware Error:", err.message);
        
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

module.exports = { authUser };
