import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({allowedRole}){
    const {user , loading} = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 font-medium">athenticating...</p>
            </div>
        );
    }

    if(!user){
        return <Navigate to="/login" replace />
    }

    if (allowedRole && user.role !== allowedRole){
        return <Navigate to={user.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard'} replace />
    }

    return <Outlet />
}