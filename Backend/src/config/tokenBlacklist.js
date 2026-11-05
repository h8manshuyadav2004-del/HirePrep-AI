// Used while Redis is unavailable; entries expire with their JWTs.
const localBlacklist = new Map();

function add(token, expiresAt) {
    localBlacklist.set(token, expiresAt);
}

function has(token) {
    const expiresAt = localBlacklist.get(token);
    if (!expiresAt) return false;
    if (expiresAt <= Math.floor(Date.now() / 1000)) {
        localBlacklist.delete(token);
        return false;
    }
    return true;
}

module.exports = { add, has };
