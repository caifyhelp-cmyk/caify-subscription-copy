import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInquiryStore } from '../state/inquiries';
import { useCustomerStore } from '../state/customers';
import { useAuthStore } from '../state/auth';
import { useAuditLogStore } from '../state/auditLogs';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { INQUIRY_STATUS_LABELS } from '../constants/labels';
import { format } from 'date-fns';

export const InquiryDetail: React.FC = () => {
    const { inquiryId } = useParams<{ inquiryId: string }>();
    const navigate = useNavigate();
    const { currentRole, currentSalesId } = useAuthStore();

    const { getInquiryById, updateInquiryStatus, deleteInquiry, deleteAnswer } = useInquiryStore();
    const inquiry = getInquiryById(inquiryId!);
    const customer = useCustomerStore(state => inquiry ? state.getCustomerById(inquiry.customerId) : undefined);
    const { addAuditLog } = useAuditLogStore();

    const [answerInput, setAnswerInput] = useState(inquiry?.answer?.content || '');

    if (!inquiry) {
        return (
            <div className="flex justify-center items-center h-64">
                <EmptyState title="문의 내역을 찾을 수 없습니다" description="잘못된 접근이거나 삭제된 문의입니다." />
            </div>
        );
    }

    if (currentRole === 'SALES' && customer?.assignedSalesId !== currentSalesId) {
        return (
            <div className="flex justify-center items-center h-64">
                <EmptyState title="접근 권한 없음" description="담당하고 있는 고객의 문의가 아닙니다." />
            </div>
        );
    }

    const handleAnswerSubmit = () => {
        if (!answerInput.trim()) return;
        updateInquiryStatus(inquiry.inquiryId, 'ANSWERED', answerInput, currentRole, 'Current User');

        // Mock Notification send
        addAuditLog({
            actorRole: currentRole,
            actorName: 'System',
            actionType: 'SEND_NOTIFICATION',
            targetType: 'CUSTOMER',
            targetId: inquiry.customerId,
            meta: { method: 'ALIMTALK', template: 'inquiry_answered' }
        });

        alert('답변이 등록되었으며 고객에게 알림톡이 정상적으로 발송되었습니다.');
    };

    const handleDeleteInquiry = () => {
        if (window.confirm('정말 이 문의를 삭제하시겠습니까? 연관된 데이터도 함께 삭제됩니다.')) {
            deleteInquiry(inquiry.inquiryId, currentRole, 'Current User');
            navigate('/inquiries', { replace: true });
        }
    };

    const handleDeleteAnswer = () => {
        if (window.confirm('등록된 답변을 삭제하시겠습니까? 삭제 후 이전 상태로 돌아갑니다.')) {
            deleteAnswer(inquiry.inquiryId, currentRole, 'Current User');
            setAnswerInput('');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">문의 상세</h2>
                    <StatusBadge status={inquiry.status} label={INQUIRY_STATUS_LABELS[inquiry.status]} type="inquiry" />
                </div>
                <div className="flex gap-2 items-center">
                    {currentRole === 'ADMIN' && (
                        <button onClick={handleDeleteInquiry} className="text-sm border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md font-medium transition-colors">삭제</button>
                    )}
                    <button onClick={() => navigate(-1)} className="text-sm border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium bg-white shadow-sm transition-colors">목록으로</button>
                </div>
            </div>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 rounded-xl">
                <div className="border-b border-gray-100 pb-5 mb-5">
                    <h1 className="text-2xl font-extrabold text-gray-900">{inquiry.title}</h1>
                    <div className="mt-3 text-sm text-gray-500 flex flex-wrap gap-x-6 gap-y-2 font-medium">
                        <span>작성일: {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                        {customer && (
                            <span>
                                고객명: <span onClick={() => navigate(`/customers/${customer.customerId}`)} className="text-indigo-600 hover:text-indigo-800 cursor-pointer">{customer.name}</span>
                            </span>
                        )}
                        <span>분류: <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded ml-1">{inquiry.type}</span></span>
                    </div>
                </div>

                <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed min-h-[120px] bg-gray-50 p-5 rounded-lg border border-gray-100">
                    {inquiry.content}
                </div>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">답변 처리 정보</h3>

                {inquiry.answer && (
                    <Card className="p-6 bg-indigo-50/50 border border-indigo-100 shadow-sm rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-indigo-900">기존 등록된 답변 <span className="text-xs font-normal text-indigo-600 ml-1">({inquiry.answer.authorRole})</span></span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-indigo-600">{format(new Date(inquiry.answer.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                                {currentRole === 'ADMIN' && (
                                    <button onClick={handleDeleteAnswer} className="text-xs text-red-500 hover:underline">답변 삭제</button>
                                )}
                            </div>
                        </div>
                        <div className="whitespace-pre-wrap text-indigo-900 text-sm p-4 bg-white rounded-lg border border-indigo-100/50 shadow-sm">
                            {inquiry.answer.content}
                        </div>
                    </Card>
                )}

                <Card className="p-6 bg-white shadow-sm border border-gray-200 rounded-xl">
                    <label htmlFor="answer" className="block text-sm font-bold leading-6 text-gray-900 mb-2">
                        {inquiry.answer ? '답변 수정하기' : '새 답변 작성하기'}
                    </label>
                    <textarea
                        id="answer"
                        rows={6}
                        className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 resize-y"
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="고객에게 전달될 답변 내용을 상세하게 입력해 주세요."
                        readOnly={currentRole === 'SALES'}
                    />
                    {currentRole !== 'SALES' && (
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-gray-500">답변을 저장하면 고객에게 카카오 알림톡이 즉시 발송됩니다.</span>
                            <button
                                type="button"
                                onClick={handleAnswerSubmit}
                                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                            >
                                {inquiry.answer ? '수정된 답변 반영 및 재전송' : '답변 확정 및 완료 전송'}
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
