import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
    status: string;
    label?: string;
    className?: string;
    type?: 'subscription' | 'payment' | 'inquiry' | 'settlement' | 'default';
}

const getStylesByStatus = (status: string): { container: string, text: string, textStyle: string } => {
    switch (status) {
        // Success / Active
        case 'ACTIVE':
        case 'PAID':
        case 'ANSWERED':
            return {
                container: 'bg-green-50 text-green-700 ring-green-600/20',
                text: 'bg-green-500',
                textStyle: 'text-green-700'
            };
        // Warning / Pending
        case 'TRIAL':
        case 'PENDING':
        case 'ON_HOLD':
        case 'REFUND_REQUESTED':
            return {
                container: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
                text: 'bg-yellow-500',
                textStyle: 'text-yellow-800'
            };
        // Error / Failed / Cancelled
        case 'PAYMENT_FAILED':
        case 'SUSPENDED':
        case 'CANCELLED':
        case 'FAILED':
        case 'REFUND':
            return {
                container: 'bg-red-50 text-red-700 ring-red-600/10',
                text: 'bg-red-500',
                textStyle: 'text-red-700'
            };
        // Normal / Open
        case 'OPEN':
            return {
                container: 'bg-blue-50 text-blue-700 ring-blue-700/10',
                text: 'bg-blue-500',
                textStyle: 'text-blue-700'
            };
        default:
            return {
                container: 'bg-gray-50 text-gray-500 ring-gray-500/10',
                text: 'bg-gray-500',
                textStyle: 'text-gray-600'
            };
    }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
    const styles = getStylesByStatus(status);
    const displayLabel = label || status;

    return (
        <span className={twMerge(clsx(
            'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            styles.container
        ), className)}>
            <svg className={twMerge(clsx("mr-1.5 h-1.5 w-1.5", styles.textStyle))} fill="currentColor" viewBox="0 0 8 8">
                <circle cx={4} cy={4} r={3} className={styles.text} />
            </svg>
            {displayLabel}
        </span>
    );
};
