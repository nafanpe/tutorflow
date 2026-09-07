import { useEffect, useState } from "react";
import {useAuth} from "../context/AuthContext"
import { LogOut, Calendar, BookOpen, CheckCircle, FileText, Loader2 } from "lucide-react";
import { sessionAPI } from "../services/apiService";

export default function StudentDashboard(){
    const { logout, user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMySessions = async () => {
            try {
                const res = await sessionAPI.getAll()
                setSessions(res.data)
            } catch (error) {
                console.error(error)
                setError("Failed to load your sessions.")
            } finally {
                setLoading(false)
            }
        }
        fetchMySessions()
    }, [])

    if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;

    const upcomingSessions = sessions.filter(s => s.status === "Scheduled")
    const pastSessions = sessions.filter(s => ['Completed', 'AI reviewed'].includes(s.status));

    return(
        <div className="min-h-screen bg-slate-50" >
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm" >
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
                    <p className="text-slate-500 font-medium">Welcome back, {user.name}</p>
                </div>
                <button 
                    onClick={logout} 
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors"
                >
                    <LogOut size={18} /> Logout
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-8" >
                {/* Upcoming Sessions */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Calendar className="text-indigo-600" size={20} /> Upcoming Sessions
                    </h2>
                    {upcomingSessions.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-500 text-center">
                            No upcoming sessions scheduled.
                        </div>
                    ) : (
                        <div className="grid gap-4" >
                            {upcomingSessions.map(session => (
                                <div key={session.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4" >
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{session.topic}</h3>
                                        <p className="text-slate-500 text-sm font-medium">{session.subject}</p>
                                    </div>
                                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm border border-indigo-100">
                                        Status: {session.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Sessions and home-work */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <BookOpen className="text-emerald-600" size={20} /> Past Sessions & Homework
                    </h2>
                    {pastSessions.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-500 text-center">
                            No completed sessions yet.
                        </div>
                    ) : (
                        <div className="space-y-6" >
                            {pastSessions.map(session => (
                                <div key={session.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" >
                                    {/* Session Title Bar */}
                                    <div className="bg-slate-50 border-b border-slate-200 p-4">
                                        <h3 className="font-bold text-slate-900">{session.topic}</h3>
                                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mt-1">
                                            {session.subject}
                                        </p>
                                    </div>

                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6" >
                                        {/* Left Column: Read-Only Notes */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1 mb-2">
                                                <FileText size={16} className="text-slate-400"/> Session Notes
                                            </h4>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 min-h-[100px] whitespace-pre-wrap">
                                                {session.notes || "No notes were recorded for this session."}
                                            </div>
                                        </div>

                                        {/* Right Column: Homework & Review */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1 mb-2">
                                                <CheckCircle size={16} className="text-purple-500"/> Homework Tasks
                                            </h4>
                                            {!session.ai_review ? (
                                                <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    Review pending from tutor.
                                                </p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {session.ai_review.homework_tasks?.map((task, i) => (
                                                        <li key={i} className="flex gap-2 text-sm text-slate-700 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                                            <div className="mt-1 w-3 h-3 rounded-full bg-purple-300 flex-shrink-0" />
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}