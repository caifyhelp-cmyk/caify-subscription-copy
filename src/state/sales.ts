import { create } from 'zustand';
import type { Sales } from '../mock/types';
import { mockSales } from '../mock/data';
import { useAuditLogStore } from './auditLogs';

interface SalesState {
    sales: Sales[];
    baseCommissionRate: number; // Global default rate
    getSalesById: (id: string) => Sales | undefined;
    updateBaseCommissionRate: (rate: number, actorRole: string, actorName: string) => void;
    updateSalesCommissionRate: (salesId: string, rate: number, actorRole: string, actorName: string) => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
    sales: mockSales,
    baseCommissionRate: 0.06, // 6% Default
    getSalesById: (id) => {
        return get().sales.find(s => s.salesId === id);
    },
    updateBaseCommissionRate: (rate, actorRole, actorName) => {
        const oldRate = get().baseCommissionRate;
        set({ baseCommissionRate: rate });

        useAuditLogStore.getState().addAuditLog({
            actorRole: actorRole as any,
            actorName,
            actionType: 'UPDATE_COMMISSION_RATE',
            targetType: 'SYSTEM',
            targetId: 'base_commission',
            meta: { oldValue: oldRate, newValue: rate }
        });
    },
    updateSalesCommissionRate: (salesId, rate, actorRole, actorName) => {
        const sales = get().sales.find(s => s.salesId === salesId);
        const oldRate = sales?.commissionRate;

        set(state => ({
            sales: state.sales.map(s => s.salesId === salesId ? { ...s, commissionRate: rate } : s)
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole: actorRole as any,
            actorName,
            actionType: 'UPDATE_COMMISSION_RATE',
            targetType: 'SALES',
            targetId: salesId,
            meta: { oldValue: oldRate, newValue: rate }
        });
    }
}));
