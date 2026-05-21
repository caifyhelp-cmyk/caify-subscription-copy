import { create } from 'zustand';
import type { Inquiry, Role } from '../mock/types';
import { mockInquiries } from '../mock/data';
import { useAuditLogStore } from './auditLogs';

interface InquiryState {
    inquiries: Inquiry[];

    // Actions
    updateInquiryStatus: (inquiryId: string, status: Inquiry['status'], answerContent: string | undefined, actorRole: Role, actorName: string) => void;
    deleteInquiry: (inquiryId: string, actorRole: Role, actorName: string) => void;
    deleteAnswer: (inquiryId: string, actorRole: Role, actorName: string) => void;

    // Selectors
    getInquiryById: (inquiryId: string) => Inquiry | undefined;
    getInquiriesByCustomerId: (customerId: string) => Inquiry[];
}

export const useInquiryStore = create<InquiryState>((set, get) => ({
    inquiries: mockInquiries,

    updateInquiryStatus: (inquiryId, status, answerContent, actorRole, actorName) => {
        const inq = get().inquiries.find(i => i.inquiryId === inquiryId);
        if (!inq) return;

        const isExistingAnswer = !!inq.answer;
        const now = new Date().toISOString();

        set(state => ({
            inquiries: state.inquiries.map(i => {
                if (i.inquiryId !== inquiryId) return i;
                return {
                    ...i,
                    status,
                    answer: answerContent ? {
                        content: answerContent,
                        authorRole: actorRole,
                        createdAt: i.answer?.createdAt || now,
                        updatedAt: now
                    } : undefined
                };
            })
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: isExistingAnswer ? 'UPDATE_INQUIRY_ANSWER' : 'CREATE_INQUIRY_ANSWER',
            targetType: 'INQUIRY',
            targetId: inquiryId,
            meta: {
                prevStatus: inq.status,
                newStatus: status,
                hasAnswer: !!answerContent
            }
        });
    },

    getInquiryById: (inquiryId) => {
        return get().inquiries.find(i => i.inquiryId === inquiryId);
    },

    getInquiriesByCustomerId: (customerId) => {
        return get().inquiries.filter(i => i.customerId === customerId);
    },

    deleteInquiry: (inquiryId, actorRole, actorName) => {
        set(state => ({
            inquiries: state.inquiries.filter(i => i.inquiryId !== inquiryId)
        }));
        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'DELETE_INQUIRY',
            targetType: 'INQUIRY',
            targetId: inquiryId
        });
    },

    deleteAnswer: (inquiryId, actorRole, actorName) => {
        set(state => ({
            inquiries: state.inquiries.map(i =>
                i.inquiryId === inquiryId ? { ...i, answer: undefined, status: 'OPEN' } : i
            )
        }));
        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'DELETE_INQUIRY_ANSWER',
            targetType: 'INQUIRY',
            targetId: inquiryId
        });
    }
}));
