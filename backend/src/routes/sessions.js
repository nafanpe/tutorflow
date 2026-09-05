const express = require('express')
const pool = require('../db')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)

// fetch sessions
router.get('/', async (req, res) => {
    try {
        const isTutor = req.user.role === 'tutor'
        const column = isTutor ? 's.tutor_id' : 's.student_id'
        const query = `
            select s.id, s.topic, s.start_time, s.end_time, s.status,
                u.name as student_name, sp.subject
            from sessions s
            join users u on s.student_id = u.id
            join student_profiles sp on sp.student_id = u.id
            where ${column} = $1
            order by s.start_time asc
        `
        const result = await pool.query(query, [req.user.id])
        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch sessions."})
    }
})

router.post('/',requireRole('tutor'), async (req, res) => {
    const { student_id, topic, start_time, end_time } = req.body;

    
})