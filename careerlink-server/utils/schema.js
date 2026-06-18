const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "uploads");

const columns = {
    users: [
        ["suspended", "TINYINT(1) DEFAULT 0"],
        ["headline", "VARCHAR(255) NULL"],
        ["location", "VARCHAR(255) NULL"],
        ["resume", "VARCHAR(255) NULL"],
        ["skills", "JSON NULL"],
        ["education", "JSON NULL"],
        ["experience", "JSON NULL"],
        ["company_name", "VARCHAR(255) NULL"],
        ["industry", "VARCHAR(255) NULL"],
        ["company_description", "TEXT NULL"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
    ],
    jobs: [
        ["company", "VARCHAR(255) NULL"],
        ["employment_type", "VARCHAR(100) DEFAULT 'Full-time'"],
        ["status", "VARCHAR(50) DEFAULT 'Open'"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
    ],
    applications: [
        ["resume", "VARCHAR(255) NULL"],
        ["note", "TEXT NULL"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
    ],
};

function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function columnExists(db, table, column) {
    const rows = await query(db, "SHOW COLUMNS FROM ?? LIKE ?", [table, column]);
    return rows.length > 0;
}

async function addMissingColumns(db) {
    for (const [table, tableColumns] of Object.entries(columns)) {
        for (const [column, definition] of tableColumns) {
            const exists = await columnExists(db, table, column);
            if (!exists) {
                await query(db, `ALTER TABLE ?? ADD COLUMN ${column} ${definition}`, [table]);
            }
        }
    }
}

async function createCoreTables(db) {
    await query(
        db,
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'jobseeker',
            suspended TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
    );

    await query(
        db,
        `CREATE TABLE IF NOT EXISTS jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            salary DECIMAL(12, 2) DEFAULT 0,
            description TEXT NOT NULL,
            employer_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_jobs_employer (employer_id)
        )`,
    );

    await query(
        db,
        `CREATE TABLE IF NOT EXISTS applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            user_id INT NOT NULL,
            status VARCHAR(50) DEFAULT 'Submitted',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_job_applicant (job_id, user_id),
            INDEX idx_applications_user (user_id)
        )`,
    );
}

async function createNotificationsTable(db) {
    await query(
        db,
        `CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
    );
}

async function createOtpTable(db) {
    await query(
        db,
        `CREATE TABLE IF NOT EXISTS email_otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            purpose VARCHAR(50) NOT NULL,
            payload JSON NULL,
            used TINYINT(1) DEFAULT 0,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
    );
}

async function ensureSchema(db) {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    await createCoreTables(db);
    await addMissingColumns(db);
    await createNotificationsTable(db);
    await createOtpTable(db);
}

module.exports = { ensureSchema, query, uploadDir };
