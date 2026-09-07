const { GoogleGenAI } = require('@google/genai');
require('dotenv').config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const generateLessonPlan = async (studentProfile, topic) => {
    const prompt = `
        You are an expert tutor. Create a lesson plan for a ${studentProfile.current_level} student in ${studentProfile.subject}.
        Topic: ${topic}
        Student's Learning Goals: ${studentProfile.learning_goals}
        Student's Weak Areas: ${studentProfile.weak_areas}
        
        Return ONLY a raw JSON object with this exact structure:
        {
            "learning_objectives": ["objective 1", "objective 2"],
            "lesson_outline": ["step 1", "step 2", "step 3", "step 4"],
            "practice_questions": ["question 1", "question 2", "question 3"]
        }
    `
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
}

const generateSessionReview = async (studentProfile, topic, notes) => {
    const prompt = `
        You are an expert tutor reviewing a completed session.
        Topic: ${topic}
        Student Weak Areas: ${studentProfile.weak_areas}
        Tutor's Live Notes: ${notes}
        
        Based on the notes, generate a session review and homework.
        Return ONLY a raw JSON object with this exact structure:
        {
            "summary": "1 paragraph summary of how the student did",
            "homework_tasks": ["task 1", "task 2"],
            "next_session_focus": "Recommendation for the next class"
        }
    `

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
}

module.exports = { generateLessonPlan, generateSessionReview };