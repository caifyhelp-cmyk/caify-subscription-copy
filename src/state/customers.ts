import { create } from 'zustand';
import type { Customer, Role } from '../mock/types';
import { mockCustomers } from '../mock/data';
import { useAuditLogStore } from './auditLogs';
import { useSalesDbStore } from './salesDb';
import { formatISO } from 'date-fns';

interface CustomerState {
    customers: Customer[];

    // Selectors
    getCustomerById: (id: string) => Customer | undefined;
    getCustomersBySalesId: (salesId: string) => Customer[];
    getCustomersVisibleToRole: (role: Role, salesId: string) => Customer[];

    // Actions
    // Actions
    updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
    updateCustomerField: (customerId: string, field: keyof Customer, value: any, actorRole: string, actorName: string) => void;
    registerCustomerMock: (name: string, phone: string, accountId: string) => void;
    consumeTrial: (customerId: string, actorRole: string, actorName: string) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: mockCustomers,

    getCustomerById: (id) => get().customers.find(c => c.customerId === id),

    getCustomersBySalesId: (salesId) => get().customers.filter(c => c.assignedSalesId === salesId),

    getCustomersVisibleToRole: (role, salesId) => {
        const all = get().customers;
        if (role === 'SALES') {
            return all.filter(c => c.assignedSalesId === salesId);
        }
        return all;
    },

    updateCustomer: (customerId, updates) => set((state) => ({
        customers: state.customers.map(c =>
            c.customerId === customerId ? { ...c, ...updates } : c
        )
    })),

    updateCustomerField: (customerId, field, value, actorRole, actorName) => {
        set(state => {
            const customer = state.customers.find(c => c.customerId === customerId);
            if (!customer) return state;

            const oldValue = customer[field];

            useAuditLogStore.getState().addAuditLog({
                actorRole: actorRole as any,
                actorName,
                actionType: 'UPDATE_CUSTOMER_INFO',
                targetType: 'CUSTOMER',
                targetId: customerId,
                meta: { field, oldValue, newValue: value }
            });

            return {
                customers: state.customers.map(c =>
                    c.customerId === customerId ? { ...c, [field]: value } : c
                )
            };
        });
    },

    registerCustomerMock: (name, phone, accountId) => {
        // 1. Phone matching in Sales DB
        const matchLead = useSalesDbStore.getState().getLeadByPhone(phone);

        let assignedSalesId: string | null = null;
        let trialCount = 0;
        let memo = '';

        if (matchLead) {
            assignedSalesId = matchLead.salesId;
            if (matchLead.trialGrantFlag) {
                trialCount = 10;
                memo = '가입 시 체험판 10회 부여됨 (자동 연결)';
                // Update Lead Status
                useSalesDbStore.getState().updateLeadStatus(matchLead.leadId, 'TRIAL', 'ADMIN', 'System Auto Match');
            } else {
                memo = '영업 DB 매칭됨 (체험판 정책 비활성)';
            }
        } else {
            memo = '영업 DB 매칭 없음 - 직접 가입';
        }

        const newCustId = `cust_${String(get().customers.length + 1).padStart(3, '0')}`;

        const newCustomer: Customer = {
            customerId: newCustId,
            accountId,
            name,
            contact: phone,
            industry: matchLead?.industry || 'Unknown',
            joinedAt: formatISO(new Date()),
            assignedSalesId,
            trialCount,
            memo
        };

        set(state => ({
            customers: [newCustomer, ...state.customers]
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole: 'ADMIN',
            actorName: 'System Auto Register',
            actionType: 'CUSTOMER_REGISTER',
            targetType: 'CUSTOMER',
            targetId: newCustId,
            meta: { reason: '신규 고객 가입 (모킹)', phoneMatch: !!matchLead }
        });
    },

    consumeTrial: (customerId, actorRole, actorName) => {
        set(state => {
            const customer = state.customers.find(c => c.customerId === customerId);
            if (!customer) return state;

            const currentCount = customer.trialCount ?? 0;
            if (currentCount <= 0) return state;

            const newCount = currentCount - 1;
            let newStatus = customer.serviceStatus;

            if (newCount === 0) {
                newStatus = 'FREE';
            }

            useAuditLogStore.getState().addAuditLog({
                actorRole: actorRole as any,
                actorName,
                actionType: 'CONSUME_TRIAL',
                targetType: 'CUSTOMER',
                targetId: customerId,
                meta: { before: currentCount, after: newCount }
            });

            if (newStatus === 'FREE' && customer.serviceStatus !== 'FREE') {
                useAuditLogStore.getState().addAuditLog({
                    actorRole: 'ADMIN',
                    actorName: 'System',
                    actionType: 'UPDATE_CUSTOMER_STATUS',
                    targetType: 'CUSTOMER',
                    targetId: customerId,
                    meta: {
                        prevStatus: customer.serviceStatus,
                        newStatus: 'FREE',
                        reason: 'Trial count exhausted',
                    }
                });
            }

            return {
                customers: state.customers.map(c =>
                    c.customerId === customerId ? { ...c, trialCount: newCount, serviceStatus: newStatus } : c
                )
            };
        });
    }
}));
