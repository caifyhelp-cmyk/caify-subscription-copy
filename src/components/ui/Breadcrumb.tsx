import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BREADCRUMB_LABELS } from '../../constants/labels';

export const Breadcrumb: React.FC = () => {
    const location = useLocation();
    const paths = location.pathname.split('/').filter(Boolean);

    if (paths.length === 0) return null;

    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                    <Link to="/" className="hover:text-gray-900">홈</Link>
                </li>
                {paths.map((path, index) => {
                    const isLast = index === paths.length - 1;
                    const to = `/${paths.slice(0, index + 1).join('/')}`;

                    let label = BREADCRUMB_LABELS[path] || path;

                    if (path === 'dashboard') label = '대시보드';
                    if (path === 'analytics') label = '매출 분석';
                    if (path === 'audit') label = '운영 로그';

                    if (index > 0) {
                        const prevPath = paths[index - 1];
                        if (['customers', 'inquiries', 'sales'].includes(prevPath)) {
                            label = prevPath === 'customers' ? '고객 상세' :
                                prevPath === 'inquiries' ? '문의 상세' :
                                    '영업사원 상세';
                        }
                    }

                    return (
                        <li key={to} className="flex items-center">
                            <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                            {isLast ? (
                                <span className="font-semibold text-gray-900">{label}</span>
                            ) : (
                                <Link to={to} className="hover:text-gray-900">{label}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
