import { useState, useEffect } from "react";
import { studentAPI, sessionAPI } from "../services/apiService";

export function useTutorDashboard(){
    const [students, setStudents] = useState([])
    const [sessions, setSessions] = useState([])
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [isSessionModalOpen, setSessionModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [studentRes, sessionRes] = await Promise.all([
                studentAPI.getAll(), 
                sessionAPI.getAll(),
            ])
            setStudents(studentRes.data);
            setSessions(sessionRes.data);
        } catch (error) {
            setError('Failed to load dashboard data');
            console.error(error)
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const addStudent = async (studentData) => {
        try {
            await studentAPI.create(studentData)
            setStudentModalOpen(false)
            fetchData()
        } catch (error) {
            throw error.response?.data?.error || 'Failed to add student'
        }
    }

    const scheduleSession = async (sessionData) => {
        try {
            await sessionAPI.create(sessionData)
            setSessionModalOpen(false)
            fetchData()
        } catch (error) {
            throw error.response?.data?.error || 'Failed to schedule session'
        }
    }

    return {
        students,
        sessions,
        isLoading,
        error,
        modals: {
            student: isStudentModalOpen,
            setStudent: setStudentModalOpen,
            session: isSessionModalOpen,
            setSession: setSessionModalOpen
        },
        actions: {
            addStudent,
            scheduleSession
        }
    }
}