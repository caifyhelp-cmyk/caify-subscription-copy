import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth';
import type { Role } from '../../mock/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { currentRole } = useAuthStore();

    if (!allowedRoles.includes(currentRole)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
