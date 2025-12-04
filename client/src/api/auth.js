import axiosInstance from './axios';

export const login = async (email, password) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    return response.data;
};

export const register = async (email, password, name) => {
    const response = await axiosInstance.post('/api/auth/register', { email, password, name });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getStoredUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getStoredToken = () => {
    return localStorage.getItem('token');
};

export const setAuthData = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};
