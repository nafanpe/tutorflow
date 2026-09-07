import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { authAPI } from "../services/apiService"

// icons
import {BookOpen} from 'lucide-react'

export default function LoginPage(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { login, user } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const res = await authAPI.login({ email, password });
            login(res.data.user, res.data.token);
            navigate(res.data.user.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard')
            
        } catch (error) {
            console.error("error: ", error)
            const backendErrorMessage = error.response?.data?.error;
            setError(backendErrorMessage || 'Login failed. Please try again.');            
            
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            navigate(user.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard', { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-8 text-indigo-600">
                <BookOpen size={32} />
                <h1 className="text-3xl font-bold text-slate-900">TutorFlow</h1>
            </div>

            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8" >
                <h2 className="text-2xl font-semibold text-slate-900 text-center mb-6">Sign In</h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4" >
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" >Email</label>
                        <input
                          type="email"
                          required
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                        type="password"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-70"
                    >
                        {isLoading ? 'Signing In...' : "Sign In"}
                    </button>
                </form>
            </div>

            {/* <div className="mt-8 text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                <p className="font-semibold mb-1">Demo Credentials</p>
                <p>Tutor: tutor@demo.com / pass123</p>
            </div> */}
        </div>
    )
}