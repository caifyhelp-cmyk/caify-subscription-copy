import React from 'react';
import { FileSearch } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface EmptyStateProps {
    title?: string;
    description?: string;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = '데이터가 없습니다.',
    description = '검색 조건에 맞는 결과가 없거나 아직 등록된 데이터가 없습니다.',
    className
}) => {
    return (
        <div className={twMerge(clsx('text-center py-12 px-6', className))}>
            <FileSearch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
    );
};
