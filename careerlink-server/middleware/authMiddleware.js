const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { getJwtSecret } = require("../utils/jwt");
const { query } = require("../utils/schema");

async function authenticate(req, res, next) {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const payload = jwt.verify(token, getJwtSecret());
        const rows = await query(db, "SELECT id, name, email, role, suspended FROM users WHERE id = ? LIMIT 1", [payload.id]);
        const user = rows[0];

        if (!user) return res.status(401).json({ message: "Account no longer exists" });
        if (user.suspended) return res.status(403).json({ message: "This account is suspended" });

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired session" });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to perform this action" });
        }
        next();
    };
}

function requireSelf(paramName = "userId") {
    return (req, res, next) => {
        if (Number(req.user?.id) !== Number(req.params[paramName])) {
            return res.status(403).json({ message: "You can only modify your own profile" });
        }
        next();
    };
}

module.exports = { authenticate, requireRole, requireSelf };
