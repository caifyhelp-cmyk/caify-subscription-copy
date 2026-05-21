import { create } from 'zustand';
import type { Settlement, Payment, Role } from '../mock/types';
import { useAuditLogStore } from './auditLogs';
import { useSalesStore } from './sales';
import { useCustomerStore } from './customers';
import { useSubscriptionStore } from './subscriptions';
import { mockPayments } from '../mock/data';

interface SettlementState {
    settlements: Settlement[];

    // Actions
    processPaymentForSettlement: (payment: Payment) => void;
    handleRefundDeduction: (payment: Payment) => void;
    updateSettlementStatus: (settlementId: string, status: Settlement['status'], actorRole: Role, actorName: string) => void;

    // Selectors
    getSettlementsBySalesId: (salesId: string) => Settlement[];
}

export const useSettlementStore = create<SettlementState>((set, get) => {
    // Generate initial settlements from mockPayments
    const initialSettlements: Settlement[] = [];
    const salesState = useSalesStore.getState();

    mockPayments.forEach(payment => {
        // Exclude refunds natively from generating a pending settlement.
        if (!payment.salesId || payment.status === 'REFUND' || payment.status === 'REFUND_REQUESTED' || payment.status === 'FAILED') return;
        const sId = payment.salesId as string;

        const rate = salesState.getSalesById(sId)?.commissionRate ?? salesState.baseCommissionRate;
        const commission = payment.amount * rate;

        const customerStore = useCustomerStore.getState();
        const subscribeStore = useSubscriptionStore.getState();

        const customer = customerStore.customers.find(c => c.customerId === payment.customerId);
        const sub = subscribeStore.subscriptions.find(s => s.subscriptionId === payment.subscriptionId);

        initialSettlements.push({
            settlementId: `stl_${payment.paymentId}`,
            salesId: sId,
            paymentId: payment.paymentId,
            customerId: payment.customerId,
            customerName: customer?.name || 'Unknown',
            product: sub?.product || 'Unknown',
            paymentAmount: payment.amount,
            commissionRate: rate,
            amount: commission,
            paidAt: payment.paidAt,
            status: 'PENDING'
        });
    });

    return {
        settlements: initialSettlements,

        processPaymentForSettlement: (payment) => {
            // Exclude refunds natively from generating a pending settlement.
            if (!payment.salesId || payment.status === 'REFUND' || payment.status === 'REFUND_REQUESTED' || payment.status === 'FAILED') return;
            const sId = payment.salesId as string;

            const salesStore = useSalesStore.getState();
            const sales = salesStore.getSalesById(sId);
            const rate = sales?.commissionRate ?? salesStore.baseCommissionRate;

            const commission = payment.amount * rate;

            const customerStore = useCustomerStore.getState();
            const subscribeStore = useSubscriptionStore.getState();

            const customer = customerStore.customers.find(c => c.customerId === payment.customerId);
            const sub = subscribeStore.subscriptions.find(s => s.subscriptionId === payment.subscriptionId);

            set((state) => {
                const existingIdx = state.settlements.findIndex(
                    s => s.paymentId === payment.paymentId
                );

                if (existingIdx >= 0) {
                    return state;
                } else {
                    const newSettlement: Settlement = {
                        settlementId: `stl_${payment.paymentId}`,
                        salesId: sId,
                        paymentId: payment.paymentId,
                        customerId: payment.customerId,
                        customerName: customer?.name || 'Unknown',
                        product: sub?.product || 'Unknown',
                        paymentAmount: payment.amount,
                        commissionRate: rate,
                        amount: commission,
                        paidAt: payment.paidAt,
                        status: 'PENDING'
                    };

                    useAuditLogStore.getState().addAuditLog({
                        actorRole: 'SYSTEM' as any,
                        actorName: 'System',
                        actionType: 'CREATE_SETTLEMENT',
                        targetType: 'SETTLEMENT',
                        targetId: newSettlement.settlementId,
                        meta: { amount: newSettlement.amount }
                    });

                    return { settlements: [...state.settlements, newSettlement] };
                }
            });
        },

        handleRefundDeduction: (payment) => {
            if (!payment.salesId) return;
            const sId = payment.salesId as string;

            set((state) => {
                const existingIdx = state.settlements.findIndex(
                    s => s.paymentId === payment.paymentId
                );

                if (existingIdx >= 0) {
                    const updated = [...state.settlements];
                    const targetStl = updated[existingIdx];
                    updated.splice(existingIdx, 1);

                    useAuditLogStore.getState().addAuditLog({
                        actorRole: 'SYSTEM' as any,
                        actorName: 'System',
                        actionType: 'DEDUCT_SETTLEMENT',
                        targetType: 'SETTLEMENT',
                        targetId: targetStl.settlementId,
                        meta: { deduction: targetStl.amount, newAmount: 0 }
                    });

                    return { settlements: updated };
                }
                return state;
            });
        },

        updateSettlementStatus: (settlementId, status, actorRole, actorName) => {
            let prevStatus = '';
            set((state) => {
                const settlements = state.settlements.map(s => {
                    if (s.settlementId === settlementId) {
                        prevStatus = s.status;
                        return { ...s, status };
                    }
                    return s;
                });
                return { settlements };
            });

            const actionType = status === 'PAID' ? 'COMPLETE_SETTLEMENT' :
                status === 'ON_HOLD' ? 'HOLD_SETTLEMENT' : 'UPDATE_SETTLEMENT';

            useAuditLogStore.getState().addAuditLog({
                actorRole,
                actorName,
                actionType,
                targetType: 'SETTLEMENT',
                targetId: settlementId,
                meta: { prevStatus, newStatus: status }
            });
        },

        getSettlementsBySalesId: (salesId) => {
            return get().settlements.filter(s => s.salesId === salesId);
        }
    };
});
