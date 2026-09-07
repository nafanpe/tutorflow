import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom'
import { sessionAPI } from "../services/apiService";
import { ArrowLeft, Play, CheckCircle, Sparkles, Lock, Save, Loader2 } from 'lucide-react';
import { useDebounce } from "../hooks/useDebounce";

export default function SessionRoom(){
    const { id } = useParams()
    const navigate = useNavigate()

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [notes, setNotes] = useState('');
    const debouncedNotes = useDebounce(notes, 1000)
    const [saveStatus, setSaveStatus] = useState('Saved');
    const [isGenerating, setIsGenerating] = useState(false);

    const isInitialMount = useRef(true);

    useEffect(() => {
        const fetchSession = async () =>{
            try {
                const res = await sessionAPI.getById(id)
                setSession(res.data)
                setNotes(res.data.notes)
            } catch (error) {
                console.error(error)
                setError('Failed to load session workspace.');
            } finally {
                setLoading(false);
            }
        }
        fetchSession();
    }, [id])

    useEffect(() => {
        if(isInitialMount.current){
            isInitialMount.current = false
            return
        }

        const saveNotes = async () => {
            if(session?.status !== 'In progress') return
            setSaveStatus('Saving...')
            try {
                await sessionAPI.updateNotes(id, debouncedNotes)
                setSaveStatus('All changes saved');
            } catch (error) {
                console.error(error)
                setSaveStatus('Error saving');
            }
        }

        saveNotes()
    }, [debouncedNotes, id, session?.status])

    // Action Handlers
    const handleStatusChange = async (newStatus) => {
        try {
            await sessionAPI.updateStatus(id, newStatus)
            setSession(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error(error)
            alert('Failed to update status.');
        }
    }

    const handleGeneratePlan = async () => {
        setIsGenerating(true)
        try {
            const res = await sessionAPI.generatePlan(id)
            setSession(prev => ({ ...prev, ai_plan: res.data.ai_plan }));
        } catch (error) {
            console.error(error);
            alert('Failed to generate plan.');
        } finally {
            setIsGenerating(false);
        }
    }

    const handleGenerateReview = async () => {
        setIsGenerating(true)
        try {
            const res = await sessionAPI.generateReview(id);
            setSession(prev => ({ ...prev, ai_review: res.data.ai_review, status: res.data.status }));
        } catch (error) {
            console.error(error)
            alert(error.response?.data?.error || 'Failed to generate review.');
        } finally {
            setIsGenerating(false);
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    const isLocked = ['Completed', 'AI reviewed'].includes(session.status);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col" >
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate('/tutor/dashboard')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium mb-2" >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">{session.topic}</h1>
                    <p className="text-slate-500 font-medium">{session.student_name} • {session.subject} • Level: {session.current_level}</p>
                </div>

                {/* State Action Buttons */}
                <div className="flex items-center gap-3" >
                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 mr-2 border border-slate-200" >
                        Status: {session.status}
                    </div>

                    {session.status === 'Scheduled' && (
                        <button onClick={() => handleStatusChange('In progress')} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors" >
                            <Play size={18} /> Start Session
                        </button>
                    )}

                    {session.status === 'In progress' && (
                        <button onClick={() => handleStatusChange('Completed')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                            <CheckCircle size={18} /> Complete Session
                        </button>
                    )}
                </div>
            </header>
            {/* 3-panels Workspace */}
                <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto w-full" >
                    {/* panel-1: AI lesson plan */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden" >
                        <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-600" /> AI Lesson Plan
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" >
                            {!session.ai_plan ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-500" >
                                    <p>Generate a customized lesson plan based on {session.student_name}'s weak areas.</p>
                                    <button 
                                        onClick={handleGeneratePlan}
                                        disabled={isGenerating || session.status != 'Scheduled'}
                                        className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} 
                                        Generate Plan
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6" >
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Objectives</h3>
                                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                                            {session.ai_plan.learning_objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Outline</h3>
                                        <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                                            {session.ai_plan.lesson_outline.map((step, i) => <li key={i}>{step}</li>)}
                                        </ol>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Practice Questions</h3>
                                        <div className="space-y-2">
                                            {session.ai_plan.practice_questions.map((q, i) => (
                                            <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">{q}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* panel-2: notepad */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                            <span>Session Notes</span>
                            {isLocked ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded"><Lock size={12}/> Locked</span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><Save size={14}/> {saveStatus}</span>
                            )}
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isLocked || session.status === 'Scheduled'}
                            placeholder={session.status === 'Scheduled' ? "Notes unlock when session starts..." : "Type live session notes here. Autosaves automatically..."}
                            className="flex-1 w-full p-4 resize-none outline-none text-slate-700 bg-white disabled:bg-slate-50 transition-colors"
                        />
                    </section>

                    {/* panel-3: AI review and homework */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden" >
                        <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-600" /> AI Review & Homework
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" >
                            {!['Completed', 'AI reviewed'].includes(session.status) ? (
                                <div className="h-full flex items-center justify-center text-center text-slate-400 p-4">
                                    Available once the session is marked as Completed.
                                </div>
                            ) : !session.ai_review ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-500" >
                                    <p>Generate a summary and homework assignments based on your live notes.</p>
                                    <button
                                        onClick={handleGenerateReview}
                                        disabled={isGenerating || notes.trim() === ''}
                                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} 
                                        Run AI Review
                                    </button>
                                    {notes.trim() === '' && <p className="text-xs text-red-500">Notes are required to generate a review.</p>}
                                </div>
                            ) : (
                                <div className="space-y-6" >
                                    <div>
                                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">Performance Summary</h3>
                                        <p className="text-slate-700 text-sm leading-relaxed">{session.ai_review.summary}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">Homework Tasks</h3>
                                        <ul className="space-y-2">
                                            {session.ai_review.homework_tasks.map((task, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-700 items-start">
                                                <div className="mt-1 w-4 h-4 rounded border border-slate-300 flex-shrink-0"></div>
                                                {task}
                                            </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100" >
                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                            <h3 className="text-sm font-bold text-purple-700 mb-1">Next Session Focus</h3>
                                            <p className="text-sm text-purple-900">{session.ai_review.next_session_focus}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
        </div>
    )
}