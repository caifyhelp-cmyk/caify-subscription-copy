import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSalesDbStore } from '../state/salesDb';
import { useAuthStore } from '../state/auth';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';

export const SalesLeadDetail: React.FC = () => {
    const { leadId } = useParams<{ leadId: string }>();
    const navigate = useNavigate();
    const { getLeadById, updateLeadStatus } = useSalesDbStore();
    const { currentRole, currentSalesId } = useAuthStore();

    const lead = getLeadById(leadId!);

    // Access guards
    if (currentRole === 'MANAGER') {
        return <Navigate to="/" replace />;
    }

    if (!lead || (currentRole === 'SALES' && lead.salesId !== currentSalesId)) {
        return (
            <div className="flex justify-center items-center h-64">
                <EmptyState title="접근 권한 없음" description="존재하지 않거나 열람할 수 없는 리드 정보입니다." />
            </div>
        );
    }

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as typeof lead.status;
        updateLeadStatus(lead.leadId, newStatus, currentRole, 'Current User');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">영업 리드(DB) 상세 정보</h2>
                <button onClick={() => navigate('/sales-leads')} className="text-sm border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 font-medium bg-white shadow-sm">목록으로</button>
            </div>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 rounded-xl">
                <div className="flex justify-between items-start border-b border-gray-200 pb-5 mb-5">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">{lead.customerName}</h1>
                        <p className="mt-2 text-sm text-gray-500 font-mono">가망 고객 연락처: {lead.customerPhone}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">현재 리드 진행 상태</span>
                        <select
                            value={lead.status}
                            onChange={handleStatusChange}
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 font-semibold shadow-sm"
                        >
                            <option value="CONTACTED">연락 완료 (Contacted)</option>
                            <option value="TRIAL">체험판 제공 진행중 (Trialing)</option>
                            <option value="CONVERTED">계약 완료 (Converted)</option>
                            <option value="DROPPED">영업 종료/드랍 (Dropped)</option>
                        </select>
                    </div>
                </div>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 mb-1">담당 영업자</dt>
                        <dd className="text-base text-gray-900 font-medium">{lead.salesName} <span className="text-xs text-gray-400 font-mono">({lead.salesId})</span></dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 mb-1">고객 업종</dt>
                        <dd className="text-base text-gray-900 font-medium">{lead.industry}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 mb-1">DB 등록/생성 시각</dt>
                        <dd className="text-base text-gray-900 font-medium">{format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm')}</dd>
                    </div>

                    <div className="sm:col-span-3 border-t pt-5 mt-2 border-dashed">
                        <dt className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            체험판 자동 부여 정책 (가입 후 적용)
                            {lead.trialGrantFlag && <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">Active</span>}
                        </dt>
                        <dd className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {lead.trialGrantFlag ? (
                                <p>✅ 이 연락처(`{lead.customerPhone}`)를 가진 고객이 회원가입을 완료할 경우, 시스템이 즉시 체험판 기능(10회)을 제공하고 담당자를 `{lead.salesName}` 으로 자동 연결합니다.</p>
                            ) : (
                                <p>❌ 자동 매칭 및 체험판 권한이 비활성화 되어 있습니다. 향후 가입은 직접가입(일반 연결)로 처리될 수 있습니다.</p>
                            )}
                        </dd>
                    </div>
                </dl>
            </Card>
        </div>
    );
};
