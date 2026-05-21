import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../state/payments';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { useAuthStore } from '../state/auth';
import { useTableData } from '../state/table/useTableData';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { SelectFilter } from '../components/ui/SelectFilter';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PAYMENT_STATUS_LABELS } from '../constants/labels';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const Payments: React.FC = () => {
    const { payments, processRefund } = usePaymentStore();
    const { getCustomersVisibleToRole, customers } = useCustomerStore();
    const { subscriptions } = useSubscriptionStore();
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const visibleCustomers = getCustomersVisibleToRole(currentRole, currentSalesId);
    const visibleCustomerIds = new Set(visibleCustomers.map(c => c.customerId));

    const baseList = payments
        .filter(p => visibleCustomerIds.has(p.customerId))
        .map(p => {
            const customer = customers.find(c => c.customerId === p.customerId);
            const sub = subscriptions.find(s => s.subscriptionId === p.subscriptionId);
            return {
                ...p,
                customerName: customer?.name || 'Unknown',
                product: sub?.product || 'Unknown'
            };
        });

    let filteredByDate = baseList;
    if (startDate && endDate) {
        filteredByDate = baseList.filter(p => {
            const payDate = parseISO(p.paidAt);
            return isWithinInterval(payDate, {
                start: startOfDay(parseISO(startDate)),
                end: endOfDay(parseISO(endDate))
            });
        });
    }

    const {
        paginatedData: paginatedList,
        totalItems,
        totalPages,
        currentPage,
        setCurrentPage,
        sortConfig,
        handleSort,
        itemsPerPage
    } = useTableData({
        data: filteredByDate,
        searchQuery,
        searchFields: ['customerName'],
        filterConfig: filterStatus ? [{ key: 'status', value: filterStatus }] : [],
        initialSortKey: 'paidAt',
        initialSortDirection: 'desc',
        itemsPerPage: 10
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof typeof baseList[0] }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    const handleRefund = (paymentId: string) => {
        if (window.confirm('정말 이 결제를 환불 요청 처리하시겠습니까?')) {
            processRefund(paymentId, currentRole, 'Current User');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">결제 내역 관리</h2>
            </div>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="고객명 검색..."
                        />
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-center w-full md:w-auto">
                        <SelectFilter
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="결제 상태 전체"
                            options={Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                            className="w-full md:w-36"
                        />
                        <div className="flex gap-2 items-center text-sm">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 px-3 focus:ring-2 focus:ring-indigo-600"
                            />
                            <span className="text-gray-500">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 px-3 focus:ring-2 focus:ring-indigo-600"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('paidAt')}>
                                결제일 <SortIcon columnKey="paidAt" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('customerName')}>
                                고객명 <SortIcon columnKey="customerName" />
                            </Th>
                            <Th>상품</Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('amount')}>
                                결제 금액 <SortIcon columnKey="amount" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                                상태 <SortIcon columnKey="status" />
                            </Th>
                            <Th>수단</Th>
                            <Th>액션</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(p => (
                            <Tr key={p.paymentId}>
                                <Td className="text-gray-500">{format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm')}</Td>
                                <Td
                                    className="font-medium text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline"
                                    onClick={() => navigate(`/customers/${p.customerId}`)}
                                >
                                    {p.customerName}
                                </Td>
                                <Td className="text-gray-500">{p.product}</Td>
                                <Td className={p.status === 'REFUND' ? 'text-red-500 font-medium' : 'text-gray-900 font-medium'}>
                                    {p.status === 'REFUND' ? '-' : ''}{p.amount.toLocaleString()}원
                                </Td>
                                <Td>
                                    <StatusBadge status={p.status} label={PAYMENT_STATUS_LABELS[p.status] || p.status} type="payment" />
                                </Td>
                                <Td className="text-gray-500">{p.method}</Td>
                                <Td>
                                    {p.status === 'PAID' && currentRole !== 'SALES' && (
                                        <button
                                            onClick={() => handleRefund(p.paymentId)}
                                            className="text-red-600 hover:text-red-800 text-xs font-semibold border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            환불 요청
                                        </button>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState description="조건에 맞는 결제 내역이 없습니다." />
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </Card>
        </div>
    );
};
