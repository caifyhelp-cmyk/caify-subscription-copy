import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSalesDbStore } from '../state/salesDb';
import { useSalesStore } from '../state/sales';
import { useAuthStore } from '../state/auth';
import { Card } from '../components/ui/Card';

export const SalesLeadForm: React.FC = () => {
    const { addLead } = useSalesDbStore();
    const { sales } = useSalesStore();
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    // Access Guard
    if (currentRole === 'MANAGER') {
        return <Navigate to="/" replace />;
    }

    // Default bindings
    const myAgentInfo = sales.find(s => s.salesId === currentSalesId);

    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        industry: 'IT/Software',
        salesId: currentRole === 'SALES' ? currentSalesId : sales[0]?.salesId || '',
        trialGrantFlag: false
    });

    const isSubmittable = form.customerName.trim() !== '' && form.customerPhone.trim() !== '' && form.salesId !== '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSubmittable) return;

        const selectedSales = sales.find(s => s.salesId === form.salesId);

        addLead({
            salesId: form.salesId,
            salesName: selectedSales?.name || 'Unknown',
            salesPhone: selectedSales?.phone || '',
            customerName: form.customerName,
            customerPhone: form.customerPhone,
            industry: form.industry,
            trialGrantFlag: form.trialGrantFlag
        }, currentRole, currentRole === 'SALES' ? (myAgentInfo?.name || 'Sales') : 'Admin');

        alert('영업 DB가 정상적으로 등록되었습니다.');
        navigate('/sales-leads', { replace: true });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">영업 DB 신규 등록</h2>
                <button onClick={() => navigate(-1)} className="text-sm border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 font-medium bg-white shadow-sm">취소</button>
            </div>

            <Card className="p-8 bg-white shadow-sm border border-gray-200 rounded-xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="border-b border-gray-900/10 pb-8">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">가망 고객 정보</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">이곳에 입력된 연락처를 기준으로 향후 고객 가입 시 자동으로 연동 매칭됩니다.</p>

                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="customerName" className="block text-sm font-medium leading-6 text-gray-900">고객사(고객)명 *</label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        id="customerName"
                                        value={form.customerName}
                                        onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="(주)가나다"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="customerPhone" className="block text-sm font-medium leading-6 text-gray-900">고객 연락처 *</label>
                                <div className="mt-2">
                                    <input
                                        type="tel"
                                        id="customerPhone"
                                        value={form.customerPhone}
                                        onChange={e => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 font-mono"
                                        placeholder="010-1234-5678"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="industry" className="block text-sm font-medium leading-6 text-gray-900">업종</label>
                                <div className="mt-2">
                                    <select
                                        id="industry"
                                        value={form.industry}
                                        onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    >
                                        <option value="IT/Software">IT/Software</option>
                                        <option value="Manufacturing">제조업 (Manufacturing)</option>
                                        <option value="Retail">도소매업 (Retail)</option>
                                        <option value="Healthcare">의료 (Healthcare)</option>
                                        <option value="Finance">금융/부동산 (Finance)</option>
                                        <option value="Other">기타</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-900/10 pb-8">
                        <h2 className="text-base font-semibold leading-7 text-gray-900">영업 매칭 규칙</h2>
                        <div className="mt-6 space-y-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="salesId" className="block text-sm font-medium leading-6 text-gray-900">담당 영업자 바인딩 (Reference Key) *</label>
                                <div className="mt-2">
                                    <select
                                        id="salesId"
                                        value={form.salesId}
                                        onChange={e => setForm(prev => ({ ...prev, salesId: e.target.value }))}
                                        disabled={currentRole === 'SALES'}
                                        className="block w-full max-w-sm rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        {sales.map(s => (
                                            <option key={s.salesId} value={s.salesId}>{s.name} ({s.salesId})</option>
                                        ))}
                                    </select>
                                </div>
                                {currentRole === 'SALES' && (
                                    <p className="mt-2 text-sm text-gray-500">영업점 권한은 본인 계정만 바인딩 처리 가능합니다.</p>
                                )}
                            </div>

                            <div className="relative flex gap-x-3">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="trialGrantFlag"
                                        name="trialGrantFlag"
                                        type="checkbox"
                                        checked={form.trialGrantFlag}
                                        onChange={e => setForm(prev => ({ ...prev, trialGrantFlag: e.target.checked }))}
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                </div>
                                <div className="text-sm leading-6">
                                    <label htmlFor="trialGrantFlag" className="font-semibold text-gray-900 block select-none cursor-pointer">가입 즉시 체험판(10회) 자동 부여 정책 활성화</label>
                                    <p className="text-gray-500">이 항목을 체크하면 향후 고객이 앱스에 가입 시 즉석에서 체험판(10회) 및 `TRIAL` 상태로 변경 처리됩니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-x-4">
                        <button
                            type="submit"
                            disabled={!isSubmittable}
                            className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            DB에 등록 완료
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
