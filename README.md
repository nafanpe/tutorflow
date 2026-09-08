# TutorFlow 
**Developer:** Nafan P E

**Please Note Backend is Hosted on Render - it'll take Approximately 30 seconds to cold start the server on first request**

TutorFlow is a role-based educational technology platform designed to streamline 1-on-1 online tutoring. It provides state-managed session lifecycles, real-time debounced note-taking, and tailored AI integrations to assist tutors with lesson planning and homework generation.

---

## Access Links & Credentials

**Live Deployment:** https://tutorflow-nafan.vercel.app/
**Repository:** https://github.com/nafanpe/tutorflow

### Test Logins
To evaluate the application, please use the following seeded credentials. The backend strictly isolates data based on the authenticated user's role and ID.

**Tutor Account**
> **Email:** tutor@demo.com
> **Password:** pass123

**Student Account**
> **Email:** student@demo.com
> **Password:** pass123

---

## Database Architecture

The PostgreSQL database is normalized to ensure data integrity and enforce role-based access constraints efficiently. 

### Tables & Relationships

**1. `users`**
* **Columns:** `id` (PK), `name`, `email`, `password_hash`, `role` (enum: 'tutor', 'student').
* **Purpose:** Handles core authentication and role-based access control (RBAC).

**2. `student_profiles`**
* **Columns:** `id` (PK), `student_id` (FK), `subject`, `current_level`, `learning_goals`, `weak_areas`.
* **Relationships:** `student_id` is a one-to-one Foreign Key referencing `users.id`.
* **Purpose:** Stores academic context. Separating this from the `users` table prevents the auth object from becoming bloated while ensuring the AI has dedicated context for prompt generation.

**3. `sessions`**
* **Columns:** `id` (PK), `tutor_id` (FK), `student_id` (FK), `topic`, `start_time`, `end_time`, `status`, `notes`, `ai_plan`, `ai_review`.
* **Relationships:** 
  * `tutor_id` references `users.id` (Many-to-One).
  * `student_id` references `users.id` (Many-to-One).
* **Purpose:** The central transaction table. Including `tutor_id` directly on the session record acts as a critical security layer, preventing Insecure Direct Object References (IDOR) without requiring complex table joins during simple state updates.

---

## AI Integration & Prompt Engineering

The platform utilizes Google's `gemini-3.5-flash` model via the `@google/genai` SDK. The AI is restricted to strict JSON schemas to ensure the React frontend can reliably map and render the outputs.

### Pre-Session AI Plan
**Prompt:**
```text
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
```

**Design Rationale:** A generic "generate a lesson plan" prompt produces low-value, boilerplate results. By explicitly injecting the student's `weak_areas`, `current_level`, and `learning_goals`, the LLM is forced to ground its response in the specific context of that user. Enforcing the strict JSON schema guarantees that the frontend 3-panel UI will not crash due to unexpected text formatting or markdown wrappers.

### Post-Session AI Review
**Prompt:**
```text
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
```

**Design Rationale:** This prompt acts as a synthesizing engine. It correlates the tutor's live, debounced workspace notes with the student's historic `weak_areas`. This ensures the generated `homework_tasks` actively target the areas where the student struggled during that specific hour, creating a highly personalized feedback loop.

---

## Tech Stack & Libraries

### Frontend

* **React** — Core UI library for building a dynamic single-page application.
* **Tailwind CSS** — Utility-first CSS framework for responsive, modern styling.
* **React Router DOM** — For client-side routing and managing role-based protected routes.
* **Axios** — For handling asynchronous HTTP requests and intercepting global authentication errors.
* **Lucide React** — For clean, scalable SVG iconography across the dashboard.

### Backend

* **Node.js & Express** — Lightweight server architecture for handling RESTful API requests.
* **PostgreSQL (`pg`)** — Relational database ensuring strict data isolation, referential integrity, and atomic transactions.
* **`@google/genai`** — The official Google SDK used to interface with the Gemini AI model for session planning and reviews.
* **JSON Web Tokens (`jsonwebtoken`)** — For stateless, secure user authentication and role validation.
* **Bcrypt (`bcryptjs`)** — For cryptographic password hashing prior to database storage.
* **Dotenv** — For secure environment variable management.

---

## API Endpoints & Routing

The Express backend strictly enforces Role-Based Access Control (RBAC) via JWT middleware. Routes are protected to ensure tutors can only access their assigned students, and students can only view their own data.

### Authentication (`/api/auth`)
* `POST /login` - Validates credentials and issues a 7-day JWT (Public).
* `GET /me` - Verifies the JWT and restores the client-side session (Protected).
* `GET /seed` - Generates the initial test users for the evaluation (Public).

### Students (`/api/students`)
* `GET /` - Fetches all students assigned to the logged-in tutor (Tutor only).
* `POST /` - Creates a new student profile with learning goals and weak areas (Tutor only).

### Sessions (`/api/sessions`)
* `GET /` - Fetches all sessions. Dynamically returns tutor-assigned sessions or student-enrolled sessions based on the requester's role (Protected).
* `POST /` - Schedules a new session. Includes backend validation to prevent time overlaps/double-booking (Tutor only).
* `GET /:id` - Retrieves a specific session joined with the student's context profile for the 3-panel workspace (Tutor only).
* `PATCH /:id/status` - Moves the session through the strict lifecycle (`Scheduled` → `In progress` → `Completed` → `AI reviewed`) (Tutor only).
* `PATCH /:id/notes` - Debounced endpoint to continuously autosave live session notes. Locked if the session is completed (Tutor only).

### AI Integration (`/api/sessions`)
* `POST /:id/ai-plan` - Prompts Gemini to generate a tailored JSON lesson plan using the student's weak areas and goals (Tutor only).
* `POST /:id/ai-review` - Prompts Gemini to evaluate the tutor's live notes and return a JSON performance summary and homework tasks (Tutor only).

---

## Future Enhancements

If I had another day to continue developing TutorFlow, I would build a progress tracking view where the AI analyzes all past session reviews to map a student's long-term trajectory. I would also integrate a email service like SendGrid to automatically notify students when a new session is scheduled or when their homework is ready. Implementing real-time WebSocket connections would enhance the Live Session Room, ensuring that lifecycle state changes lock the workspace instantly across all active clients without requiring a manual refresh. I would expand the existing middleware to support an administrative role for onboarding new tutors and overseeing platform utilization metrics. Finally, adding a robust error monitoring tool and comprehensive React loading skeletons would further polish the user experience during API latency spikes, also improving the look of ui.