const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        // Check if email already exists
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [name, email, password_hash, role || "dispatcher"]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({ token, user });
    } catch (err) {
        console.error("Register error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user
        const result = await pool.query(
            "SELECT id, name, email, password_hash, role, avatar_url FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password_hash, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("GetMe error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { register, login, getMe };
