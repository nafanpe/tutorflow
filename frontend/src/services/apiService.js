import axios, { create } from "axios";
import axiosInstance from "./axiosInstance";

export const authAPI = {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    getMe: () => axiosInstance.get('/auth/me'),
}

export const studentAPI = {
    getAll: () => axiosInstance.get('/students'),
    create: (data) => axiosInstance.post('/students', data),
}

export const sessionAPI = {
    getAll: () => axiosInstance.get('/sessions'),
    create: (data) => axiosInstance.post('/sessions', data),
    getById: (id) => axiosInstance.get(`/sessions/${id}`),
    updateStatus: (id, status) => axiosInstance.patch(`/sessions/${id}/status`, { status }),
    updateNotes: (id, notes) => axiosInstance.patch(`/sessions/${id}/notes`, { notes }),
    generatePlan: (id) => axiosInstance.post(`/sessions/${id}/ai-plan`),
    generateReview: (id) => axiosInstance.post(`/sessions/${id}/ai-review`),
}