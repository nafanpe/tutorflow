const express = require('express')
const cors = require('cors')
require('dotenv').config()
const pool = require('./db')

// import Routes
const authRoutes = require('./routes/auth')
const studentRoutes = require('./routes/students')
const sessionRoutes = require('./routes/sessions')

const app = express()

// middlewares
app.use(cors({origin: process.env.CLIENT_URL || '*'}))
app.use(express.json())

// Authentitcation Routes
app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/sessions', sessionRoutes)

// test route
app.get('/api/health', async (req, res) => {
    try {
        const dbTest = await pool.query('select now()')
        res.status(200).json({status: 'ok', db_connected: true, time: dbTest.rows[0].now})
    } catch (error) {
        res.status(500).json({status: 'error', message: error.message})
    }
})

// start app
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Backend runnning on https://localhost:${PORT}`)
})