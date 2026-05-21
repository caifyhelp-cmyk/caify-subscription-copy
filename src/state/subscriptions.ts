import { create } from 'zustand';
import type { Subscription, Role } from '../mock/types';
import { mockSubscriptions } from '../mock/data';
import { useAuditLogStore } from './auditLogs';

interface SubscriptionState {
    subscriptions: Subscription[];

    // Actions
    updateSubscriptionStatus: (subscriptionId: string, status: Subscription['status'], actorRole: Role, actorName: string) => void;
    updateSubscription: (subscriptionId: string, updates: Partial<Subscription>, actorRole: Role, actorName: string) => void;

    // Selectors
    getSubscriptionByCustomerId: (customerId: string) => Subscription | undefined;
    getSubscriptionById: (subscriptionId: string) => Subscription | undefined;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    subscriptions: mockSubscriptions,

    updateSubscriptionStatus: (subscriptionId, status, actorRole, actorName) => {
        const sub = get().subscriptions.find(s => s.subscriptionId === subscriptionId);
        if (!sub || sub.status === status) return;

        const prevStatus = sub.status;

        set(state => ({
            subscriptions: state.subscriptions.map(s =>
                s.subscriptionId === subscriptionId ? { ...s, status } : s
            )
        }));

        // Log audit
        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'UPDATE_SUBSCRIPTION_STATUS',
            targetType: 'SUBSCRIPTION',
            targetId: subscriptionId,
            meta: {
                prevStatus,
                newStatus: status
            }
        });
    },

    updateSubscription: (subscriptionId, updates, actorRole, actorName) => {
        set(state => ({
            subscriptions: state.subscriptions.map(s =>
                s.subscriptionId === subscriptionId ? { ...s, ...updates } : s
            )
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'UPDATE_SUBSCRIPTION',
            targetType: 'SUBSCRIPTION',
            targetId: subscriptionId,
            meta: { updates }
        });
    },

    getSubscriptionByCustomerId: (customerId) => {
        return get().subscriptions.find(s => s.customerId === customerId);
    },

    getSubscriptionById: (subscriptionId) => {
        return get().subscriptions.find(s => s.subscriptionId === subscriptionId);
    }
}));
