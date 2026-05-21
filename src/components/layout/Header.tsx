import React from 'react';
import { RoleSwitcher } from '../ui/RoleSwitcher';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
    const location = useLocation();

    const getPageTitle = (pathname: string) => {
        const path = pathname.split('/')[1];
        switch (path) {
            case 'dashboard': return '대시보드';
            case 'customers': return '고객 관리';
            case 'subscriptions': return '구독 관리';
            case 'payments': return '결제 내역';
            case 'inquiries': return '문의 관리';
            case 'sales': return '영업점 관리';
            case 'analytics': return '매출 분석';
            case 'audit': return '감사 로그';
            case 'sales-leads': return '영업점 DB';
            default: return 'CAiFY Admin';
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1 items-center">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">{getPageTitle(location.pathname)}</h1>
                </div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <RoleSwitcher />
                </div>
            </div>
        </header>
    );
};
