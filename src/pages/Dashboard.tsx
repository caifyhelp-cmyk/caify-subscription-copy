import React, { useMemo } from 'react';
import { useCustomerStore } from '../state/customers';
import { useInquiryStore } from '../state/inquiries';
import { usePaymentStore } from '../state/payments';
import { useSubscriptionStore } from '../state/subscriptions';
import { useAuditLogStore } from '../state/auditLogs';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../state/auth';
import { Users, AlertCircle, TrendingUp, ShieldCheck, Box, CreditCard, UserX } from 'lucide-react';
import { format, parseISO, subDays, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
    const customers = useCustomerStore(state => state.customers);
    const inquiries = useInquiryStore(state => state.inquiries);
    const payments = usePaymentStore(state => state.payments);
    const subscriptions = useSubscriptionStore(state => state.subscriptions);
    const auditLogs = useAuditLogStore(state => state.auditLogs);
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    // Role Filtering logic
    const accessibleCustomers = currentRole === 'SALES'
        ? customers.filter(c => c.assignedSalesId === currentSalesId)
        : customers;

    const accessibleCustomerIds = new Set(accessibleCustomers.map(c => c.customerId));

    const accessibleInquiries = currentRole === 'SALES'
        ? inquiries.filter(i => accessibleCustomerIds.has(i.customerId))
        : inquiries;

    const accessibleSubscriptions = currentRole === 'SALES'
        ? subscriptions.filter(s => accessibleCustomerIds.has(s.customerId))
        : subscriptions;

    const accessiblePayments = currentRole === 'SALES'
        ? payments.filter(p => accessibleCustomerIds.has(p.customerId))
        : payments;

    // Check Role Access
    const isManager = currentRole === 'MANAGER';

    // KPIs
    const totalCustomers = accessibleCustomers.length;
    const trialCustomers = accessibleCustomers.filter(c => c.serviceStatus === 'TRIAL').length;
    const paidCustomers = accessibleSubscriptions.filter(s => s.status === 'ACTIVE').length;

    const now = new Date();
    const startOfMo = startOfMonth(now);
    const endOfMo = endOfMonth(now);

    const thisMonthInquiries = accessibleInquiries.filter(i => {
        const d = parseISO(i.createdAt);
        return isWithinInterval(d, { start: startOfMo, end: endOfMo });
    }).length;

    const thisMonthRevenue = accessiblePayments
        .filter(p => p.status === 'PAID' && isWithinInterval(parseISO(p.paidAt), { start: startOfMo, end: endOfMo }))
        .reduce((sum, p) => sum + p.amount, 0);

    const thisMonthExpectedPayments = accessibleSubscriptions
        .filter(s => s.status === 'ACTIVE' && isWithinInterval(parseISO(s.nextBillingAt), { start: startOfMo, end: endOfMo }))
        .reduce((sum, s) => sum + (s.product.includes('홈페이지') && s.product.includes('블로그') ? 550000 : 330000), 0);

    const thisMonthCancellations = accessibleSubscriptions
        .filter(s => s.status === 'CANCELLED' && isWithinInterval(parseISO(s.endAt), { start: startOfMo, end: endOfMo }))
        .length;

    const thisWeekNewCustomers = accessibleCustomers.filter(c => {
        const d = parseISO(c.joinedAt);
        return isWithinInterval(d, { start: startOfWeek(now), end: endOfWeek(now) });
    }).length;

    const trialExpiringCustomers = accessibleCustomers
        .filter(c => c.serviceStatus === 'TRIAL' && typeof c.trialCount === 'number' && c.trialCount <= 3)
        .sort((a, b) => (a.trialCount || 0) - (b.trialCount || 0));

    const cancelledSubscriptionsList = accessibleSubscriptions
        .filter(s => s.status === 'CANCELLED' && isWithinInterval(parseISO(s.endAt), { start: startOfMo, end: endOfMo }))
        .map(s => {
            const cust = accessibleCustomers.find(c => c.customerId === s.customerId);
            return { ...s, customerName: cust?.name || 'Unknown' };
        });

    const productStats = useMemo(() => {
        const counts: Record<string, number> = {};
        accessibleSubscriptions.forEach(s => {
            if (s.status === 'ACTIVE') {
                counts[s.product] = (counts[s.product] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [accessibleSubscriptions]);

    const paymentMethodStats = useMemo(() => {
        const counts = { CARD: 0, TRANSFER: 0 };
        accessiblePayments.forEach(p => {
            if (p.status === 'PAID') {
                if (p.method === 'CARD') counts.CARD++;
                if (p.method === 'TRANSFER') counts.TRANSFER++;
            }
        });
        return [
            { name: '카드', value: counts.CARD },
            { name: '계좌이체', value: counts.TRANSFER }
        ];
    }, [accessiblePayments]);
    const COLORS = ['#4F46E5', '#10B981'];

    // Prepare Mini Chart Data (Last 7 Days Revenue)
    const chartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');

            const dayRev = accessiblePayments
                .filter(p => p.status === 'PAID' && format(parseISO(p.paidAt), 'yyyy-MM-dd') === dateStr)
                .reduce((sum, p) => sum + p.amount, 0);

            data.push({
                date: format(date, 'MM/dd'),
                revenue: dayRev
            });
        }
        return data;
    }, [accessiblePayments]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">대시보드</h2>

            {/* KPI Cards */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">총 고객 수</dt>
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{totalCustomers}명</dd>
                </Card>

                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">유료 고객 수</dt>
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{paidCustomers}명</dd>
                </Card>

                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">체험 고객 수</dt>
                        <Box className="w-5 h-5 text-amber-500" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{trialCustomers}명</dd>
                </Card>

                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">이번 주 신규 가입</dt>
                        <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{thisWeekNewCustomers}명</dd>
                </Card>

                {/* Sales / Financial KPIs (Hidden from MANAGER) */}
                {!isManager && (
                    <>
                        <Card className="p-6 shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => navigate('/analytics')}>
                            <div className="flex items-start justify-between">
                                <dt className="text-sm font-medium text-gray-500 truncate">이번 달 매출</dt>
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <dd className="mt-4 text-3xl font-semibold text-gray-900">{thisMonthRevenue.toLocaleString()}원</dd>
                        </Card>

                        <Card className="p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <dt className="text-sm font-medium text-gray-500 truncate">이번 달 결제 예정</dt>
                                <CreditCard className="w-5 h-5 text-blue-500" />
                            </div>
                            <dd className="mt-4 text-3xl font-semibold text-gray-900">{thisMonthExpectedPayments.toLocaleString()}원</dd>
                        </Card>

                        <Card className="p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <dt className="text-sm font-medium text-gray-500 truncate">이번 달 해지 예정</dt>
                                <UserX className="w-5 h-5 text-red-500" />
                            </div>
                            <dd className="mt-4 text-3xl font-semibold text-rose-600">{thisMonthCancellations}건</dd>
                        </Card>
                    </>
                )}
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Chart Area */}
                {!isManager && (
                    <Card className="p-5 bg-white shadow-sm border border-gray-100">
                        <h3 className="text-base font-bold text-gray-900 mb-6">최근 7일 매출 추이</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                                    <Tooltip
                                        formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '매출']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}

                {/* Product Breakdown */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 mb-6">상품별 고객 수</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} interval={0} tick={{ width: 80 }} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    formatter={(value: any) => [`${value}명`, '고객 수']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Payment Methods Breakdown */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 mb-6">결제 수단 비중</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={paymentMethodStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} label>
                                    {paymentMethodStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Trial Expiration List */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-amber-600">체험판 임박 고객</h3>
                    </div>
                    <ul className="divide-y divide-gray-100 h-64 overflow-y-auto">
                        {trialExpiringCustomers.length === 0 && <p className="text-sm text-gray-500 py-4">해당 고객이 없습니다.</p>}
                        {trialExpiringCustomers.map(c => (
                            <li key={c.customerId} className="py-3 flex justify-between items-center hover:bg-gray-50 -mx-5 px-5 cursor-pointer" onClick={() => navigate(`/customers/${c.customerId}`)}>
                                <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                                <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded">잔여 {c.trialCount}회</span>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Cancellation List */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-rose-600">이번 달 해지 예정</h3>
                    </div>
                    <ul className="divide-y divide-gray-100 h-64 overflow-y-auto">
                        {cancelledSubscriptionsList.length === 0 && <p className="text-sm text-gray-500 py-4">해지 예정 고객이 없습니다.</p>}
                        {cancelledSubscriptionsList.map(s => (
                            <li key={s.subscriptionId} className="py-3 flex justify-between items-center hover:bg-gray-50 -mx-5 px-5 cursor-pointer" onClick={() => navigate(`/subscriptions`)}>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">{s.customerName}</span>
                                    <span className="text-xs text-gray-500">{s.product}</span>
                                </div>
                                <span className="text-xs font-medium text-rose-500">{format(parseISO(s.endAt), 'MM/dd')} 종료</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};
