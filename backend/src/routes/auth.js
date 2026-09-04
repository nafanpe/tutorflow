const express = require('express')
const bcrypt = require('bcryptjs')
const pool = require('../db')
const jwt = require('jsonwebtoken')
const { authenticate } = require('../middleware/auth')
require('dotenv').config()

const router = express.Router()

router.post('/login', async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body

    try {
        // validate email
        const result = await pool.query("select * from users where email = $1", [email])
        if(result.rows.length === 0){
            res.status(401).json({error: "Invalid email or password"})
        }

        const user = result.rows[0]

        // validate password
        const isValidPassword = bcrypt.compare(password, user.password_hash)
        if(!isValidPassword){
            res.status(401).json({error: "Invalid email or password"})
        }

        const token = jwt.sign(
            {id: user.id, email: user.email, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )
        
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Server error during login."})
    }
})

// For AuthContext
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = pool.query("select id, name, email, role from users where id = $1", [req.user.id])
        
        if(result.rows.length === 0){
            res.status(404).json({error: "User not found."})
        }

        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).json({error: "Server error fetching profile."})
        console.log("error: ", error)
    }
})

// Add demo tutor Route
router.get('/seed', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash("pass123", 10)
        const result = await pool.query(
            `insert into users (email, password_hash, role, name)
            values ($1, $2, $3, $4) returning id, email, role, name`,
            ['tutor@demo.com', hashedPassword, 'tutor', 'Demo Tutor']
        )
        res.status(200).json({
            message: "Test Tutor created succesfully",
            user: result.rows[0]
        })
    } catch (error) {
        if(error.code === '23505'){
            return res.status(422).json({error: "Tutor already exists."})
        }
        console.error("error: ", error)
        res.status(500).json({error: "Server error seeding data."})
    }
})

module.exports = router