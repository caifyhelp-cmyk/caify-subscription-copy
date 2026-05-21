import React, { useState, useMemo } from 'react';
import { usePaymentStore } from '../state/payments';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { useSalesStore } from '../state/sales';
import { useAuthStore } from '../state/auth';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PAYMENT_STATUS_LABELS } from '../constants/labels';
import { EmptyState } from '../components/ui/EmptyState';
import { format, isToday, isThisMonth, parseISO, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSearchParams, Navigate } from 'react-router-dom';

type PeriodFilter = 'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM';

export const Analytics: React.FC = () => {
    const { payments } = usePaymentStore();
    const { getCustomersVisibleToRole, customers } = useCustomerStore();
    const { subscriptions } = useSubscriptionStore();
    const { sales } = useSalesStore();
    const { currentRole, currentSalesId } = useAuthStore();
    const [searchParams] = useSearchParams();

    if (currentRole === 'SALES') {
        return <Navigate to="/dashboard" replace />;
    }

    const [period, setPeriod] = useState<PeriodFilter>((searchParams.get('period') === 'thisMonth' ? 'THIS_MONTH' : 'ALL') as PeriodFilter);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    let basePayments = payments;
    const visibleCustomers = getCustomersVisibleToRole(currentRole, currentSalesId);
    const assignedCustIds = new Set(visibleCustomers.map(c => c.customerId));
    basePayments = payments.filter(p => assignedCustIds.has(p.customerId));

    const filteredPayments = useMemo(() => {
        return basePayments.filter(p => {
            if (p.status !== 'PAID' && p.status !== 'REFUND') return false;

            const date = parseISO(p.paidAt);
            if (period === 'TODAY') return isToday(date);
            if (period === 'THIS_MONTH') return isThisMonth(date);
            if (period === 'CUSTOM' && startDate && endDate) {
                return isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
            }
            return true;
        }).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    }, [basePayments, period, startDate, endDate]);

    const totalRevenue = filteredPayments.reduce((sum, p) => p.status === 'REFUND' ? sum - p.amount : sum + p.amount, 0);

    const productRevMap = new Map<string, number>();
    filteredPayments.forEach(p => {
        const sub = subscriptions.find(s => s.subscriptionId === p.subscriptionId);
        if (sub) {
            const prev = productRevMap.get(sub.product) || 0;
            productRevMap.set(sub.product, p.status === 'REFUND' ? prev - p.amount : prev + p.amount);
        }
    });

    let directRevenue = 0;
    let salesTotalRevenue = 0;

    const salesRevMap = new Map<string, number>();
    filteredPayments.forEach(p => {
        const cust = customers.find(c => c.customerId === p.customerId);
        const agent = sales.find(s => s.salesId === cust?.assignedSalesId);

        const amount = p.status === 'REFUND' ? -p.amount : p.amount;

        if (agent) {
            salesTotalRevenue += amount;
            const prev = salesRevMap.get(agent.name) || 0;
            salesRevMap.set(agent.name, prev + amount);
        } else {
            directRevenue += amount;
        }
    });

    const chartDataMap = new Map<string, number>();
    filteredPayments.forEach(p => {
        const day = format(parseISO(p.paidAt), 'MM/dd');
        const prev = chartDataMap.get(day) || 0;
        chartDataMap.set(day, p.status === 'REFUND' ? prev - p.amount : prev + p.amount);
    });
    const chartData = Array.from(chartDataMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

    let bestProduct = '데이터 없음';
    let bestProductRev = 0;
    productRevMap.forEach((rev, name) => {
        if (rev > bestProductRev) { bestProductRev = rev; bestProduct = name; }
    });

    let bestSales = '데이터 없음';
    let bestSalesRev = 0;
    salesRevMap.forEach((rev, name) => {
        if (rev > bestSalesRev) { bestSalesRev = rev; bestSales = name; }
    });

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">매출 분석</h2>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as any)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 sm:max-w-xs"
                    >
                        <option value="ALL">전체 기간</option>
                        <option value="TODAY">오늘</option>
                        <option value="THIS_MONTH">이번 달</option>
                        <option value="CUSTOM">기간 지정</option>
                    </select>
                    {period === 'CUSTOM' && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm"
                            />
                            <span className="text-gray-500">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm"
                            />
                        </div>
                    )}
                </div>
            </Card>

            <dl className={`grid grid-cols-1 gap-5 ${currentRole === 'SALES' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-100 flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
                    <dt className="text-sm font-medium text-gray-500">총 매출 (선택 기간)</dt>
                    <div>
                        <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900 border-l-4 border-indigo-500 pl-3">{totalRevenue.toLocaleString()}원</dd>
                        <div className="mt-2 pl-4 text-xs text-gray-500 flex flex-col gap-1">
                            <span>본사 직접 유입: <strong className="text-indigo-600">{directRevenue.toLocaleString()}원</strong></span>
                            <span>영업자 유입: <strong className="text-emerald-600">{salesTotalRevenue.toLocaleString()}원</strong></span>
                        </div>
                    </div>
                </Card>
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-100 flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
                    <dt className="text-sm font-medium text-gray-500">가장 많이 팔린 상품</dt>
                    <div>
                        <dd className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 truncate border-l-4 border-emerald-500 pl-3">{bestProduct}</dd>
                        <dd className="text-sm font-medium text-gray-400 mt-2 pl-4 border-l-4 border-transparent">{bestProductRev.toLocaleString()}원</dd>
                    </div>
                </Card>
                {currentRole === 'ADMIN' && (
                    <Card className="px-5 py-6 bg-white shadow-sm border border-gray-100 flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
                        <dt className="text-sm font-medium text-gray-500">최우수 영업점</dt>
                        <div>
                            <dd className="mt-2 text-2xl font-bold tracking-tight text-blue-600 truncate border-l-4 border-blue-500 pl-3">{bestSales}</dd>
                            <dd className="text-sm font-medium text-gray-400 mt-2 pl-4 border-l-4 border-transparent">{bestSalesRev.toLocaleString()}원</dd>
                        </div>
                    </Card>
                )}
            </dl>

            <Card className="p-5 bg-white shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-6">기간별 매출 추이</h3>
                <div className="h-80 w-full pt-4">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`} tickMargin={12} />
                                <Tooltip
                                    formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '매출']}
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                />
                                <Bar dataKey="revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <EmptyState title="차트 데이터 없음" description="해당 기간의 매출 데이터가 없습니다." />
                        </div>
                    )}
                </div>
            </Card>

            <div className="pt-4">
                <h3 className="text-base font-bold text-gray-900 mb-4">해당 기간 결제 목록</h3>
                <Card className="bg-white border-gray-200">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>결제일</Th>
                                <Th>고객명</Th>
                                <Th>결제 상품</Th>
                                <Th>결제 금액</Th>
                                <Th>상태</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredPayments.map(p => {
                                const c = customers.find(c => c.customerId === p.customerId);
                                const s = subscriptions.find(s => s.subscriptionId === p.subscriptionId);
                                return (
                                    <Tr key={p.paymentId} className="hover:bg-gray-50">
                                        <Td className="text-gray-500">{format(parseISO(p.paidAt), 'yyyy-MM-dd HH:mm')}</Td>
                                        <Td className="font-medium text-gray-900">{c?.name || p.customerId}</Td>
                                        <Td className="text-gray-600">{s?.product || '-'}</Td>
                                        <Td className={p.status === 'REFUND' ? 'text-red-500 font-semibold' : 'text-gray-900 font-semibold'}>
                                            {p.status === 'REFUND' ? '-' : ''}{p.amount.toLocaleString()}원
                                        </Td>
                                        <Td>
                                            <StatusBadge status={p.status} label={PAYMENT_STATUS_LABELS[p.status]} type="payment" />
                                        </Td>
                                    </Tr>
                                )
                            })}
                        </Tbody>
                    </Table>
                    {filteredPayments.length === 0 && (
                        <EmptyState description="조건에 맞는 데이터가 없습니다." />
                    )}
                </Card>
            </div>
        </div>
    );
};
