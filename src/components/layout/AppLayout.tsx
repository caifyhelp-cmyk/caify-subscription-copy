import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from '../ui/Breadcrumb';

export const AppLayout: React.FC = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <Sidebar />
            </div>

            <div className="lg:pl-72 flex flex-col flex-1 w-full">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <div className="px-4 py-8 sm:px-6 lg:px-8">
                        <Breadcrumb />
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
