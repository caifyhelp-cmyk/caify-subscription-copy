import React, { useState } from 'react';
import { useSettlementStore } from '../state/settlements';
import { useAuthStore } from '../state/auth';
import { useSalesStore } from '../state/sales';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { usePaymentStore } from '../state/payments';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';

export const Settlements: React.FC = () => {
    const { currentSalesId } = useAuthStore();
    const getSettlementsBySalesId = useSettlementStore(state => state.getSettlementsBySalesId);
    const { getSalesById, baseCommissionRate } = useSalesStore();

    const salesInfo = currentSalesId ? getSalesById(currentSalesId) : null;
    const commissionRate = salesInfo?.commissionRate ?? baseCommissionRate;

    const { payments } = usePaymentStore();
    const { customers } = useCustomerStore();
    const { subscriptions } = useSubscriptionStore();

    // SALES 권한만 이 페이지에 접근하므로 currentSalesId는 존재해야 함
    const settlements = currentSalesId ? getSettlementsBySalesId(currentSalesId) : [];

    const totalSettlementAmount = settlements.reduce((sum, s) => sum + s.amount, 0);

    // 이번 달 정산 대상액 (이번 달 결제분)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSettlements = settlements.filter(s => new Date(s.paidAt).getTime() >= startOfMonth.getTime());
    const thisMonthExpected = thisMonthSettlements.reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">정산 내역</h2>
            </div>

            {salesInfo && (
                <Card className="p-6 bg-white shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">영업 담당자 정보</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{salesInfo.name} <span className="text-sm font-normal text-gray-500 ml-2">({salesInfo.phone})</span></p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">적용 수수료율</h3>
                            <p className="mt-1 text-lg font-semibold text-indigo-600">{(commissionRate * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">이번 달 정산 예정액</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{thisMonthExpected.toLocaleString()}원</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">총 누적 정산액</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{totalSettlementAmount.toLocaleString()}원</p>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h3 className="text-base font-semibold text-gray-900">개별 정산 내역</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제 일시</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">결제 금액</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">요율</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">정산 금액</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {settlements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                        표시할 정산 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                settlements.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).map(settlement => {
                                    const payment = payments.find(p => p.paymentId === settlement.paymentId);
                                    const customer = customers.find(c => c.customerId === payment?.customerId);
                                    const sub = subscriptions.find(s => s.subscriptionId === payment?.subscriptionId);
                                    const stlRate = payment ? (settlement.amount / payment.amount) : commissionRate;

                                    return (
                                        <tr key={settlement.settlementId} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {format(new Date(settlement.paidAt), 'yyyy-MM-dd HH:mm')}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {customer?.name || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {sub?.product || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 text-right">
                                                {payment?.amount.toLocaleString() || 0}원
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                                                {(stlRate * 100).toFixed(1)}%
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-indigo-700 font-bold text-right">
                                                {settlement.amount.toLocaleString()}원
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-center">
                                                <StatusBadge
                                                    status={settlement.status}
                                                    label={settlement.status === 'PENDING' ? '정산 예정' : settlement.status === 'ON_HOLD' ? '정산 보류' : '정산 완료'}
                                                    type="default"
                                                />
                                            </td>
                                        </tr>
                                    );
                                }))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
