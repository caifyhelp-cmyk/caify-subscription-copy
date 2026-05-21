import { create } from 'zustand';
import type { SalesLead, Role } from '../mock/types';
import { mockSalesLeads } from '../mock/data';
import { useAuditLogStore } from './auditLogs';
import { formatISO } from 'date-fns';

interface SalesDbState {
    salesLeads: SalesLead[];
    getLeadsVisibleToRole: (role: Role, salesId: string) => SalesLead[];
    getLeadById: (leadId: string) => SalesLead | undefined;
    getLeadByPhone: (phone: string) => SalesLead | undefined;
    addLead: (lead: Omit<SalesLead, 'leadId' | 'createdAt' | 'status'>, actorRole: Role, actorName: string) => void;
    updateLeadStatus: (leadId: string, status: SalesLead['status'], actorRole: Role, actorName: string) => void;
}

export const useSalesDbStore = create<SalesDbState>((set, get) => ({
    salesLeads: mockSalesLeads,

    getLeadsVisibleToRole: (role, salesId) => {
        const all = get().salesLeads;
        if (role === 'SALES') {
            return all.filter(lead => lead.salesId === salesId);
        }
        return all;
    },

    getLeadById: (leadId) => {
        return get().salesLeads.find(l => l.leadId === leadId);
    },

    getLeadByPhone: (phone) => {
        // Find latest active lead matching phone
        return get().salesLeads
            .filter(l => l.customerPhone === phone && l.status !== 'DROPPED')
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    },

    addLead: (leadData, actorRole, actorName) => {
        const newLeadId = `lead_${String(get().salesLeads.length + 1).padStart(3, '0')}`;
        const newLead: SalesLead = {
            ...leadData,
            leadId: newLeadId,
            status: 'CONTACTED',
            createdAt: formatISO(new Date())
        };

        set(state => ({
            salesLeads: [newLead, ...state.salesLeads]
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'CREATE_SALES_LEAD',
            targetType: 'SALES_LEAD',
            targetId: newLeadId,
            meta: {
                reason: '영업 담당자 신규 리드 등록',
                customerName: leadData.customerName
            }
        });
    },

    updateLeadStatus: (leadId, status, actorRole, actorName) => {
        const lead = get().getLeadById(leadId);
        if (!lead) return;
        const prevStatus = lead.status;

        set(state => ({
            salesLeads: state.salesLeads.map(l =>
                l.leadId === leadId ? { ...l, status } : l
            )
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'UPDATE_SALES_LEAD_STATUS',
            targetType: 'SALES_LEAD',
            targetId: leadId,
            meta: {
                prevStatus,
                newStatus: status
            }
        });
    }
}));
