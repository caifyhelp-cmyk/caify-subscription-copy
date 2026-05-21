import { create } from 'zustand';
import type { Role } from '../mock/types';

interface AuthState {
    currentRole: Role;
    currentSalesId: string;
    setRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    currentRole: 'ADMIN',
    currentSalesId: 'sales_001',
    setRole: (role) => set({ currentRole: role }),
}));
