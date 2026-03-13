import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Auth
export const exchangeSession = (sessionId) => api.post('/auth/session', { session_id: sessionId });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

// Users
export const updateProfile = (data) => api.put('/users/profile', data);
export const uploadProfilePhoto = (formData) => api.post('/users/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getUserProfile = (userId) => api.get(`/users/${userId}`);
export const getUserRatings = (userId) => api.get(`/users/${userId}/ratings`);

// Activities
export const getActivities = (params) => api.get('/activities', { params });
export const getActivity = (id) => api.get(`/activities/${id}`);
export const createActivity = (data) => api.post('/activities', data);
export const updateActivity = (id, data) => api.put(`/activities/${id}`, data);
export const deleteActivity = (id) => api.delete(`/activities/${id}`);

// Participants
export const joinActivity = (id) => api.post(`/activities/${id}/join`);
export const leaveActivity = (id) => api.delete(`/activities/${id}/leave`);
export const getParticipants = (id) => api.get(`/activities/${id}/participants`);

// Messages
export const getMessages = (activityId) => api.get(`/activities/${activityId}/messages`);
export const sendMessage = (activityId, content) => api.post(`/activities/${activityId}/messages`, { content });

// Ratings
export const ratePlayer = (activityId, data) => api.post(`/activities/${activityId}/rate`, data);
export const getActivityRatings = (activityId) => api.get(`/activities/${activityId}/ratings`);

// Upload
export const uploadFile = (formData) => api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Constants
export const getSports = () => api.get('/sports');
export const getLevels = () => api.get('/levels');

// WebSocket URL
export const getWsUrl = (activityId) => {
  const wsBase = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  return `${wsBase}/api/ws/${activityId}`;
};

export default api;
