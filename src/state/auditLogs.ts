import { create } from 'zustand';
import type { AuditLog } from '../mock/types';
import { mockAuditLogs } from '../mock/data';

interface AuditLogState {
    auditLogs: AuditLog[];
    addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;

    // Selectors
    getAuditLogsByActionType: (actionType: string) => AuditLog[];
}

// Ensure mockAuditLogs are adapted to the new schema if mock/data.ts isn't updated yet.
// We map them on initial load.
const initialLogs: AuditLog[] = mockAuditLogs.map(log => ({
    id: (log as any).logId || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    actorRole: log.actorRole,
    actorName: log.actorName,
    actionType: log.actionType,
    targetType: log.targetType,
    targetId: log.targetId,
    meta: {
        prevStatus: (log as any).before?.status,
        newStatus: (log as any).after?.status,
    },
    timestamp: log.timestamp,
}));

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
    auditLogs: initialLogs,

    addAuditLog: (log) => set((state) => ({
        auditLogs: [{
            ...log,
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString()
        }, ...state.auditLogs]
    })),

    getAuditLogsByActionType: (actionType) => {
        return get().auditLogs.filter(log => log.actionType === actionType);
    }
}));
