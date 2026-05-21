import React from 'react';
import { useAuthStore } from '../../state/auth';
import type { Role } from '../../mock/types';

export const RoleSwitcher: React.FC = () => {
    const { currentRole, setRole } = useAuthStore();

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="role-switcher" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                권한 시뮬레이터:
            </label>
            <select
                id="role-switcher"
                value={currentRole}
                onChange={(e) => setRole(e.target.value as Role)}
                className="block w-36 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
            >
                <option value="ADMIN">어드민</option>
                <option value="MANAGER">관리자</option>
                <option value="SALES">영업자</option>
            </select>
        </div>
    );
};
