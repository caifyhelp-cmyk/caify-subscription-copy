import { create } from 'zustand';
import type { Payment, Role } from '../mock/types';
import { mockPayments } from '../mock/data';
import { useAuditLogStore } from './auditLogs';

interface PaymentState {
    payments: Payment[];

    // Actions
    processPayment: (paymentData: Omit<Payment, 'status' | 'paidAt'>, actorRole: Role, actorName: string) => void;
    processRefund: (paymentId: string, actorRole: Role, actorName: string) => void;

    // Selectors
    // Selectors
    getPaymentsByCustomerId: (customerId: string) => Payment[];
    getPaymentsVisibleToRole: (role: Role, salesId: string) => Payment[];
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
    payments: mockPayments,

    processPayment: (paymentData, actorRole, actorName) => {
        // Idempotency Check: Prevent duplicate payment reflections
        const isDuplicate = get().payments.some(p => p.paymentId === paymentData.paymentId);
        if (isDuplicate) {
            console.warn(`Payment ${paymentData.paymentId} is already processed. Skipping.`);
            return;
        }

        const newPayment: Payment = {
            ...paymentData,
            status: 'PAID',
            paidAt: new Date().toISOString()
        };

        set(state => ({
            payments: [newPayment, ...state.payments]
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'PROCESS_PAYMENT',
            targetType: 'PAYMENT',
            targetId: paymentData.paymentId,
            meta: {
                amount: paymentData.amount,
                currency: paymentData.currency,
                method: paymentData.method,
                customerId: paymentData.customerId
            }
        });
    },

    processRefund: (paymentId, actorRole, actorName) => {
        const payment = get().payments.find(p => p.paymentId === paymentId);
        // Only process refund if the payment is 'PAID' or 'PENDING'
        if (!payment || payment.status === 'REFUND' || payment.status === 'FAILED') return;

        const prevStatus = payment.status;
        const newStatus = 'REFUND' as any;

        set(state => ({
            payments: state.payments.map(p =>
                p.paymentId === paymentId ? { ...p, status: newStatus } : p
            )
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'REFUND',
            targetType: 'PAYMENT',
            targetId: paymentId,
            meta: {
                prevStatus,
                newStatus,
                amount: payment.amount
            }
        });
    },

    getPaymentsByCustomerId: (customerId) => {
        return get().payments.filter(p => p.customerId === customerId);
    },

    getPaymentsVisibleToRole: (role, salesId) => {
        const all = get().payments;
        if (role === 'SALES') {
            return all.filter(p => p.salesId === salesId);
        }
        return all;
    }
}));
