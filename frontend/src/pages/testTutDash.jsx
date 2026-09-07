import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Plus, LogOut, Video } from 'lucide-react';

export default function TutorDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);

  // Form States
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: '', subject: '', current_level: 'Beginner', learning_goals: '', weak_areas: '' });
  const [sessionForm, setSessionForm] = useState({ student_id: '', topic: '', start_time: '', end_time: '' });

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [studentsRes, sessionsRes] = await Promise.all([
      fetch('http://localhost:5000/api/students', { headers }),
      fetch('http://localhost:5000/api/sessions', { headers })
    ]);
    if (studentsRes.ok) setStudents(await studentsRes.json());
    if (sessionsRes.ok) setSessions(await sessionsRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(studentForm)
    });
    if (res.ok) {
      setStudentModalOpen(false);
      fetchData();
      setStudentForm({ name: '', email: '', password: '', subject: '', current_level: 'Beginner', learning_goals: '', weak_areas: '' });
    } else {
      alert((await res.json()).error);
    }
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(sessionForm)
    });
    if (res.ok) {
      setSessionModalOpen(false);
      fetchData();
      setSessionForm({ student_id: '', topic: '', start_time: '', end_time: '' });
    } else {
      alert((await res.json()).error);
    }
  };

  const getStatusColor = (status) => {
    const colors = { 'Scheduled': 'bg-blue-100 text-blue-800', 'In progress': 'bg-amber-100 text-amber-800', 'Completed': 'bg-emerald-100 text-emerald-800', 'AI reviewed': 'bg-purple-100 text-purple-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">TutorFlow Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">Hello, {user.name}</span>
          <button onClick={logout} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sessions (Takes up 2/3 space) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar size={24}/> Upcoming & Past Sessions</h2>
            <button onClick={() => setSessionModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
              <Plus size={18} /> Schedule Session
            </button>
          </div>

          {sessions.length === 0 ? (
             <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">No sessions scheduled yet.</div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{session.topic}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>{session.status}</span>
                  </div>
                  <p className="text-sm text-slate-500">{session.student_name} • {session.subject} • {new Date(session.start_time).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => navigate(`/tutor/sessions/${session.id}`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 justify-center"
                >
                  <Video size={16} /> Open Room
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Students */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users size={24}/> Students</h2>
            <button onClick={() => setStudentModalOpen(true)} className="text-indigo-600 hover:bg-indigo-50 font-medium px-3 py-1 rounded-lg flex items-center gap-1 text-sm">
              <Plus size={16} /> Add
            </button>
          </div>

          {students.length === 0 ? (
             <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">No students added yet.</div>
          ) : (
            students.map(student => (
              <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900">{student.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{student.subject} • {student.current_level}</p>
                <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                  <span className="font-semibold block">Weak Areas:</span> {student.weak_areas}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded-lg" onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
              <input type="email" placeholder="Email (Login)" required className="w-full border p-2 rounded-lg" onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
              <input type="text" placeholder="Temporary Password" required className="w-full border p-2 rounded-lg" onChange={e => setStudentForm({...studentForm, password: e.target.value})} />
              <input type="text" placeholder="Subject (e.g. Math, React.js)" required className="w-full border p-2 rounded-lg" onChange={e => setStudentForm({...studentForm, subject: e.target.value})} />
              <select className="w-full border p-2 rounded-lg" onChange={e => setStudentForm({...studentForm, current_level: e.target.value})}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
              <textarea placeholder="Learning Goals" required className="w-full border p-2 rounded-lg h-20" onChange={e => setStudentForm({...studentForm, learning_goals: e.target.value})} />
              <textarea placeholder="Weak Areas (Used for AI Context)" required className="w-full border p-2 rounded-lg h-20" onChange={e => setStudentForm({...studentForm, weak_areas: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStudentModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Session</h2>
            <form onSubmit={handleScheduleSession} className="space-y-3">
              <select required className="w-full border p-2 rounded-lg" onChange={e => setSessionForm({...sessionForm, student_id: e.target.value})}>
                <option value="">Select Student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>)}
              </select>
              <input type="text" placeholder="Session Topic" required className="w-full border p-2 rounded-lg" onChange={e => setSessionForm({...sessionForm, topic: e.target.value})} />
              <div>
                <label className="text-sm text-slate-600 block mb-1">Start Time</label>
                <input type="datetime-local" required className="w-full border p-2 rounded-lg" onChange={e => setSessionForm({...sessionForm, start_time: e.target.value})} />
              </div>
              <div>
                <label className="text-sm text-slate-600 block mb-1">End Time</label>
                <input type="datetime-local" required className="w-full border p-2 rounded-lg" onChange={e => setSessionForm({...sessionForm, end_time: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSessionModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}