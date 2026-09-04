import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"

// Pages
import LoginPage from "./pages/LoginPage"
import TutorDashboard from "./pages/TutorDashboard"
import StudentDashboard from "./pages/StudentDashboard"

function App() {
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage/>} />

          {/* Tutor Protected Route */}
          <Route element={<ProtectedRoute allowedRole='tutor' />}>
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            {/* <Route path="/tutor/sessions/:id" element={<SessionRoom />} /> */}
          </Route>

          {/* Student Protected Route */}
          <Route element={<ProtectedRoute allowedRole='student' />} >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
          </Route>

          {/* All other Routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
