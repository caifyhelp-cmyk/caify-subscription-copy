import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSalesStore } from '../state/sales';
import { useCustomerStore } from '../state/customers';
import { useAuthStore } from '../state/auth';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { usePaymentStore } from '../state/payments';
import { useSettlementStore } from '../state/settlements';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import type { Settlement, Payment } from '../mock/types';
import { useSubscriptionStore } from '../state/subscriptions';

export const SalesDetail: React.FC = () => {
    const { salesId } = useParams<{ salesId: string }>();
    const navigate = useNavigate();
    const { currentRole } = useAuthStore();
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [rateInput, setRateInput] = useState('');

    const salesAgent = useSalesStore(state => state.getSalesById(salesId!));
    const { baseCommissionRate, updateSalesCommissionRate } = useSalesStore();
    const customers = useCustomerStore(state => state.getCustomersBySalesId(salesId!));
    const paymentsStore = usePaymentStore(state => state.payments);
    const settlements = useSettlementStore(state => state.getSettlementsBySalesId(salesId!));
    const { updateSettlementStatus } = useSettlementStore();
    const { subscriptions } = useSubscriptionStore();
    const payments = usePaymentStore(state => state.payments);

    // Sales detail is only visible to ADMIN
    if (currentRole !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    if (!salesAgent)
        return (
            <div className="flex justify-center items-center h-64">
                <EmptyState title="영업자 정보를 찾을 수 없습니다" description="존재하지 않는 영엄사원 ID입니다." />
            </div>
        );

    const assignedCustomerIds = new Set(customers.map(c => c.customerId));
    const agentPayments = paymentsStore.filter(p => assignedCustomerIds.has(p.customerId));

    const totalRevenue = agentPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);

    const commissionRate = salesAgent.commissionRate ?? baseCommissionRate;

    const handleRateSave = () => {
        const val = parseFloat(rateInput);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            updateSalesCommissionRate(salesId!, val / 100, currentRole, 'Admin');
            setIsEditingRate(false);
        } else {
            alert('올바른 요율(0~100)을 입력하세요.');
        }
    };

    const getSettlementStatusBadge = (status: Settlement['status']) => {
        switch (status) {
            case 'PAID': return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200">정산 완료</span>;
            case 'ON_HOLD': return <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-orange-200">정산 보류</span>;
            case 'PENDING': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200">정산 예정</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{salesAgent.name} 영업사원 상세 정보</h2>
                <button onClick={() => navigate('/sales')} className="text-sm border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium bg-white shadow-sm transition-colors">목록으로</button>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-200">
                    <dt className="text-sm font-bold text-gray-500">담당 고객 수</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-gray-900 border-l-4 border-indigo-500 pl-3">{customers.length.toLocaleString()}명</dd>
                </Card>
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-200">
                    <dt className="text-sm font-bold text-gray-500">누적 발생 매출 (유효 결제)</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-emerald-600 border-l-4 border-emerald-500 pl-3">{totalRevenue.toLocaleString()}원</dd>
                </Card>
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <dt className="text-sm font-bold text-gray-500">전화번호 / ID</dt>
                        <dd className="mt-2 text-xl font-bold text-gray-900 border-l-4 border-blue-500 pl-3">{salesAgent.phone}</dd>
                        <dd className="mt-1 text-sm font-medium text-gray-400 pl-4">{salesAgent.salesId}</dd>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500">적용 수수료율</span>
                            {!isEditingRate ? (
                                <p className="text-lg font-bold text-indigo-600 mt-1">{(commissionRate * 100).toFixed(1)}%</p>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        className="w-20 px-2 py-1 text-sm border rounded"
                                        value={rateInput}
                                        onChange={(e) => setRateInput(e.target.value)}
                                        placeholder="%"
                                    />
                                    <span className="text-sm font-bold">%</span>
                                </div>
                            )}
                        </div>
                        <div>
                            {!isEditingRate ? (
                                <button onClick={() => { setIsEditingRate(true); setRateInput((commissionRate * 100).toString()); }} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 font-medium">변경</button>
                            ) : (
                                <div className="flex gap-1">
                                    <button onClick={handleRateSave} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium">저장</button>
                                    <button onClick={() => setIsEditingRate(false)} className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1.5 rounded hover:bg-gray-50 font-medium">취소</button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5 bg-white shadow-sm border border-gray-200">
                    <div className="border-b pb-3 mb-4">
                        <h3 className="text-lg font-bold text-gray-900">담당 고객 목록</h3>
                    </div>
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>고객명</Th>
                                <Th>Account ID</Th>
                                <Th>업종</Th>
                                <Th>가입일</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {customers.map(c => (
                                <Tr key={c.customerId} onClick={() => navigate(`/customers/${c.customerId}`)} className="cursor-pointer hover:bg-indigo-50 transition-colors">
                                    <Td className="font-bold text-gray-900">{c.name}</Td>
                                    <Td className="text-gray-500 font-mono text-xs">{c.accountId}</Td>
                                    <Td className="text-gray-600 font-medium">{c.industry}</Td>
                                    <Td className="text-gray-500">{format(new Date(c.joinedAt), 'yyyy-MM-dd')}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                    {customers.length === 0 && (
                        <EmptyState description="현재 이 영업사원이 담당하고 있는 고객이 없습니다." />
                    )}
                </Card>

                <Card className="p-5 bg-indigo-50 shadow-sm border border-indigo-100">
                    <div className="border-b border-indigo-200 pb-3 mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-indigo-900">최근 정산 내역</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="bg-white rounded-lg overflow-hidden border border-indigo-100 shadow-sm min-w-full">
                            <Thead className="bg-indigo-50/50">
                                <Tr>
                                    <Th className="text-indigo-900 border-b border-indigo-100">결제일</Th>
                                    <Th className="text-indigo-900 border-b border-indigo-100">고객명</Th>
                                    <Th className="text-indigo-900 border-b border-indigo-100">상품</Th>
                                    <Th className="text-indigo-900 text-right border-b border-indigo-100">결제금액</Th>
                                    <Th className="text-indigo-900 text-center border-b border-indigo-100">요율</Th>
                                    <Th className="text-indigo-900 text-right border-b border-indigo-100">정산예정금</Th>
                                    <Th className="text-indigo-900 text-center border-b border-indigo-100">지급 상태</Th>
                                    <Th className="text-indigo-900 text-center border-b border-indigo-100">관리</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {settlements.length === 0 && (
                                    <Tr>
                                        <Td colSpan={8} className="text-center py-6 text-gray-500 text-sm">기록된 정산 내역이 없습니다.</Td>
                                    </Tr>
                                )}
                                {settlements.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).map(stl => {
                                    const payment = payments.find(p => p.paymentId === stl.paymentId);
                                    const customer = customers.find(c => c.customerId === payment?.customerId);
                                    const sub = subscriptions.find(s => s.subscriptionId === payment?.subscriptionId);
                                    const stlRate = payment ? (stl.amount / payment.amount) : commissionRate;

                                    return (
                                        <Tr key={stl.settlementId} className="hover:bg-indigo-50/30">
                                            <Td className="text-indigo-900 font-medium text-sm whitespace-nowrap">
                                                {format(new Date(stl.paidAt), 'yyyy-MM-dd')}
                                            </Td>
                                            <Td className="text-gray-900 font-medium whitespace-nowrap">
                                                {customer?.name || '-'}
                                            </Td>
                                            <Td className="text-gray-600 text-sm whitespace-nowrap">
                                                {sub?.product || '-'}
                                            </Td>
                                            <Td className="text-gray-600 text-right whitespace-nowrap">
                                                {payment?.amount.toLocaleString() || 0}원
                                            </Td>
                                            <Td className="text-gray-600 text-center whitespace-nowrap">
                                                {(stlRate * 100).toFixed(1)}%
                                            </Td>
                                            <Td className="text-indigo-700 font-extrabold text-right whitespace-nowrap">
                                                {stl.amount.toLocaleString()}원
                                            </Td>
                                            <Td className="text-center whitespace-nowrap">
                                                {getSettlementStatusBadge(stl.status)}
                                            </Td>
                                            <Td className="text-center whitespace-nowrap">
                                                {stl.status === 'PENDING' && (
                                                    <button onClick={() => updateSettlementStatus(stl.settlementId, 'PAID', currentRole, 'Admin')} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 font-semibold mr-1">완료</button>
                                                )}
                                                {stl.status === 'PENDING' && (
                                                    <button onClick={() => updateSettlementStatus(stl.settlementId, 'ON_HOLD', currentRole, 'Admin')} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 font-semibold">보류</button>
                                                )}
                                                {stl.status === 'ON_HOLD' && (
                                                    <button onClick={() => updateSettlementStatus(stl.settlementId, 'PENDING', currentRole, 'Admin')} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 font-semibold mr-1">보류 해제</button>
                                                )}
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
