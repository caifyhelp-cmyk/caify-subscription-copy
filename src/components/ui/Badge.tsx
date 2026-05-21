import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className, children, ...props }) => {
    const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';

    const variantClasses = {
        success: 'bg-green-50 text-green-700 ring-green-600/20',
        warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        error: 'bg-red-50 text-red-700 ring-red-600/10',
        info: 'bg-blue-50 text-blue-700 ring-blue-700/10',
        default: 'bg-gray-50 text-gray-600 ring-gray-500/10',
    };

    return (
        <span className={twMerge(clsx(baseClasses, variantClasses[variant]), className)} {...props}>
            {children}
        </span>
    );
};

export const getSubscriptionBadgeVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
        case 'ACTIVE': return 'success';
        case 'TRIAL': return 'info';
        case 'PAYMENT_FAILED': return 'error';
        case 'SUSPENDED': return 'warning';
        case 'CANCELLED': return 'default';
        default: return 'default';
    }
};

export const getPaymentBadgeVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
        case 'PAID': return 'success';
        case 'PENDING': return 'warning';
        case 'FAILED': return 'error';
        case 'REFUND': return 'default';
        default: return 'default';
    }
};

export const getInquiryBadgeVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
        case 'OPEN': return 'warning';
        case 'ANSWERED': return 'success';
        default: return 'default';
    }
};

// Korean translation helpers
export const SubscriptionStatusKR: Record<string, string> = {
    ACTIVE: '활성',
    TRIAL: '체험판',
    PAYMENT_FAILED: '결제 실패',
    SUSPENDED: '일시정지',
    CANCELLED: '해지',
};

export const PaymentStatusKR: Record<string, string> = {
    PAID: '결제완료',
    PENDING: '진행중',
    FAILED: '결제실패',
    REFUND: '환불',
};

export const InquiryStatusKR: Record<string, string> = {
    OPEN: '미답변',
    ANSWERED: '답변완료',
};
