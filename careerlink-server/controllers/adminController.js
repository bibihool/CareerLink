const db = require("../config/db");
const { query } = require("../utils/schema");

function mapAdminUser(row) {
    return { id: row.id, name: row.name, email: row.email, role: row.role, suspended: Boolean(row.suspended), createdAt: row.created_at };
}

async function getUsers(req, res) {
    const rows = await query(db, "SELECT id, name, email, role, suspended, created_at FROM users ORDER BY id DESC");
    res.json(rows.map(mapAdminUser));
}

async function setUserSuspended(req, res) {
    const targetId = Number(req.params.id);
    if (targetId === Number(req.user.id)) return res.status(400).json({ message: "You cannot suspend your own account" });

    const suspended = req.body.suspended ? 1 : 0;
    const result = await query(db, "UPDATE users SET suspended = ? WHERE id = ? AND role <> 'admin'", [suspended, targetId]);
    if (!result.affectedRows) return res.status(404).json({ message: "User not found or cannot be suspended" });
    res.json({ message: suspended ? "User suspended" : "User reactivated" });
}

module.exports = { getUsers, setUserSuspended };
