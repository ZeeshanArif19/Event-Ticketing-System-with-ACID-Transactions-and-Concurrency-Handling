import { useMutation } from '@tanstack/react-query';
import { login, register, setAuthData, logout as apiLogout, getStoredUser } from '../api/auth';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

export const useLogin = () => {
    const { login: setUserContext } = useAuthContext();

    return useMutation({
        mutationFn: ({ email, password }) => login(email, password),
        onSuccess: (data) => {
            setAuthData(data.token, data.user);
            setUserContext(data.user); // Update context immediately
        },
    });
};

export const useRegister = () => {
    const { login: setUserContext } = useAuthContext();

    return useMutation({
        mutationFn: ({ email, password, name }) => register(email, password, name),
        onSuccess: (data) => {
            setAuthData(data.token, data.user);
            setUserContext(data.user); // Update context immediately
        },
    });
};

export const useAuth = () => {
    return useAuthContext();
};
