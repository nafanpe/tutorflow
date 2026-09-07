const express = require('express')
const { authenticate, requireRole } = require('../middleware/auth')
const bcrypt = require('bcryptjs')
const pool = require('../db')

const router = express.Router()

router.use(authenticate)
router.use(requireRole('tutor'))

// fetch all students for logged in tutor
router.get('/', async (req, res) => {
    try {
        const query = `
            select u.id, u.name, sp.subject, sp.current_level, sp.learning_goals, sp.weak_areas
            from users u join student_profiles sp on u.id = sp.student_id
            where sp.tutor_id = $1
            order by u.created_at desc
        `
        const result = await pool.query(query, [req.user.id])
        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch students."})
    }
})

// create new student and their profile
router.post('/', async (req, res) => {
    const {
        name,
        email,
        password, 
        subject,
        current_level,
        learning_goals,
        weak_areas
    } = req.body
    const client = await pool.connect()

    try {
        await client.query('begin')

        const hashedPassword = await bcrypt.hash(password, 10)
        const result = await client.query(`
                insert into users (email, password_hash, role, name)
                values ($1, $2, 'student', $3) returning id
            `, [email, hashedPassword, name])

        const studentID = result.rows[0].id

        await client.query(`
                insert into student_profiles
                (student_id, tutor_id, subject, current_level, learning_goals, weak_areas)
                values ($1, $2, $3, $4, $5, $6)
            `, [studentID, req.user.id, subject, current_level, learning_goals, weak_areas])

        await client.query('commit')
        res.status(201).json({message: "Student succesfully created.", studentID})
    } catch (error) {
        await client.query('rollback')
        if (error.code === '23505'){
            res.status(400).json({error: "Email already exist."})
        }
        console.error(error)
        res.status(500).json({error: "Failed to create student."})
    } finally {
        client.release()
    }
})

module.exports = router;