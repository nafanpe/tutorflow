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
            join student_profiles sp ON u.id = sp.student_id
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

    try {
        const overlapCheck = await pool.query(
            `select id from sessions
            where tutor_id = $1
            and start_time < $3 and end_time > $2`, // return overlapped session
        [req.user.id, start_time, end_time])

        if(overlapCheck.rows.length > 0){
            return res.status(400).json({error: "Time clash: You already have a session scheduled during this window."})
        }

        const result = await pool.query(
            `insert into sessions (tutor_id, student_id, topic, start_time, end_time, status)
            values ($1, $2, $3, $4, $5, 'Scheduled') returning id`
        , [req.user.id, student_id, topic, start_time, end_time])

        res.status(201).json({message: 'Session Scheduled.', sessionId: result.rows[0].id})
    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Failed to schedule the session.'})
    }
})

module.exports = router;