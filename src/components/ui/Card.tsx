import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
    return (
        <div className={twMerge(clsx('overflow-hidden rounded-lg bg-white shadow ring-1 ring-black/5'), className)} {...props}>
            {children}
        </div>
    );
};
