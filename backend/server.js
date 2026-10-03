require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

const selectQueryStr = `
    SELECT 
        id, 
        title, 
        CAST(amount AS FLOAT) AS amount, 
        category, 
        TO_CHAR(date, 'YYYY-MM-DD') AS date 
    FROM expenses
`;

app.get('/api/expenses', async (req, res) => {
    try {
        const result = await pool.query(`${selectQueryStr} ORDER BY id ASC`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/expenses/:id', async (req, res) => {
    const id = req.params.id;

    if (isNaN(id)) {
        return res.status(404).json({ error: "Expense not found (Invalid ID)" });
    }

    try {
        const result = await pool.query(`${selectQueryStr} WHERE id = $1`, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/api/expenses', async (req, res) => {
    const { title, amount, category, date } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a number greater than 0" });
    }
    const allowedCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];
    if (!category || !allowedCategories.includes(category)) {
        return res.status(400).json({ error: "Category must be Food, Transport, Bills, Entertainment, or Other" });
    }
    if (!date) {
        return res.status(400).json({ error: "Date is required" });
    }

    try {
        const query = `
            INSERT INTO expenses (title, amount, category, date) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, title, CAST(amount AS FLOAT) AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
        `;
        const result = await pool.query(query, [title, amount, category, date]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put('/api/expenses/:id', async (req, res) => {
    const id = req.params.id;
    const { title, amount, category, date } = req.body;

    if (isNaN(id)) {
        return res.status(404).json({ error: "Expense not found (Invalid ID)" });
    }
    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a number greater than 0" });
    }
    const allowedCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];
    if (!category || !allowedCategories.includes(category)) {
        return res.status(400).json({ error: "Category must be Food, Transport, Bills, Entertainment, or Other" });
    }
    if (!date) {
        return res.status(400).json({ error: "Date is required" });
    }

    try {
        const query = `
            UPDATE expenses 
            SET title = $1, amount = $2, category = $3, date = $4 
            WHERE id = $5 
            RETURNING id, title, CAST(amount AS FLOAT) AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
        `;
        const result = await pool.query(query, [title, amount, category, date, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    const id = req.params.id;

    if (isNaN(id)) {
        return res.status(404).json({ error: "Expense not found (Invalid ID)" });
    }

    try {
        const result = await pool.query("DELETE FROM expenses WHERE id = $1 RETURNING id", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }
        
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});