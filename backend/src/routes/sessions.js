const express = require('express')
const pool = require('../db')
const { authenticate, requireRole } = require('../middleware/auth')
const { generateLessonPlan, generateSessionReview } = require('../services/aiService')

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

// create sessions
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

// fetch session details for workspace
router.get('/:id', async (req, res) => {
    try {
        const query = `
            select s.*, u.name as student_name, sp.subject, sp.current_level, sp.learning_goals, sp.weak_areas
            from sessions s
            join users u on s.student_id = u.id
            join student_profiles sp on u.id = sp.student_id
            where s.id = $1 and s.tutor_id = $2
        `
        const result = await pool.query(query, [req.params.id, req.user.id])

        if(result.rows.length === 0) return res.status(404).json({error: 'Session not found.'})
        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Failed to fetch session.'})
    }
})

// update lifecycle state
router.patch('/:id/status', requireRole('tutor'), async (req, res) => {
    const { status } = req.body
    const validStatuses = ['Scheduled', 'In progress', 'Completed', 'AI reviewed'];

    if(!validStatuses.includes(status)){
        return res.status(400).json({error: 'Invalid Status.'})
    }

    try {
        await pool.query('update sessions set status = $1 where id = $2 and tutor_id = $3', 
            [status, req.params.id, req.user.id])
        res.json({ message: `Status updated to ${status}` });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to update status.' });
    }
})

// autosave notes
router.patch('/:id/notes', requireRole('tutor'), async (req, res) => {
    try {
        // verify status is 'In progress'
        const sessionCheck = await pool.query('select status from sessions where id = $1 and tutor_id = $2', [req.params.id, req.user.id])
        if(sessionCheck.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
        if(['Completed', 'AI reviewed'].includes(sessionCheck.rows[0].status)){
            return res.status(403).json({ error: 'Session locked. Cannot edit notes.' });
        }

        // update notes
        await pool.query('update sessions set notes = $1 where id = $2 and tutor_id = $3',
            [req.body.notes, req.params.id, req.user.id])
        res.json({ message: 'Notes saved.' });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to save notes.' });
    }
})

// generate pre-session ai-plan
router.post('/:id/ai-plan', requireRole('tutor'), async (req, res) => {
    try {
        const result = await pool.query(`
            select s.topic, sp.subject, sp.current_level, sp.learning_goals, sp.weak_areas
            from sessions s join student_profiles sp on s.student_id = sp.student_id
            where s.id = $1 and s.tutor_id = $2`, [req.params.id, req.user.id])
        
        const session = result.rows[0]
        const aiPlan = await generateLessonPlan(session, session.topic)

        await pool.query('update sessions set ai_plan = $1 where id = $2', [aiPlan, req.params.id])
        res.json({ ai_plan: aiPlan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate AI plan.' });
    }
})

// generate homework
router.post('/:id/ai-review', requireRole('tutor'), async (req, res) => {
    try {
        const result = await pool.query(`
            select s.topic, s.notes, sp.weak_areas
            from sessions s
            join student_profiles sp on s.student_id = sp.student_id
            where s.id = $1 and tutor_id = $2`, [req.params.id, req.user.id])

        const session = result.rows[0]
        if(!session.notes || session.notes.trim() === ''){
            return res.status(400).json({ error: 'Cannot generate review without session notes.' });
        }

        const aiReview = await generateSessionReview(session, session.topic, session.notes)

        await pool.query('update sessions set ai_review = $1, status = $2 where id = $3', [aiReview, 'AI reviewed', req.params.id])
        res.json({ai_review: aiReview, status: 'AI reviewed'})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate AI review.' });
    }
})

module.exports = router;