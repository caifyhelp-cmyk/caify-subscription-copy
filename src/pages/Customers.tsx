import React, { useState } from 'react';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { usePaymentStore } from '../state/payments';
import { useSalesStore } from '../state/sales';
import { useAuthStore } from '../state/auth';
import { useTableData } from '../state/table/useTableData';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { SelectFilter } from '../components/ui/SelectFilter';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SUBSCRIPTION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../constants/labels';
import { format } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const Customers: React.FC = () => {
    const { getCustomersVisibleToRole } = useCustomerStore();
    const subscriptions = useSubscriptionStore(state => state.subscriptions);
    const payments = usePaymentStore(state => state.payments);
    const sales = useSalesStore(state => state.sales);
    const { currentRole, currentSalesId } = useAuthStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Filters
    const [filterName, setFilterName] = useState(searchParams.get('name') || '');
    const [filterSubStatus, setFilterSubStatus] = useState(searchParams.get('subscriptionStatus') || '');
    const [filterPayStatus, setFilterPayStatus] = useState(searchParams.get('paymentStatus') || '');
    const [filterSalesId, setFilterSalesId] = useState(searchParams.get('assignedSalesId') || '');

    // Role Base filtering
    const baseCustomers = getCustomersVisibleToRole(currentRole, currentSalesId);

    // Mapped List
    const baseList = baseCustomers.map(c => {
        const subInfo = subscriptions.find(s => s.customerId === c.customerId);
        const custPayments = payments.filter(p => p.customerId === c.customerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
        const latestPay = custPayments[0];
        const salesAgent = sales.find(s => s.salesId === c.assignedSalesId);

        return {
            ...c,
            subscriptionStatus: subInfo?.status || '',
            paymentStatus: latestPay?.status || '',
            salesName: salesAgent?.name || '-',
        };
    });

    const filterConfig: { key: keyof typeof baseList[0], value: any }[] = [];
    if (filterSubStatus) filterConfig.push({ key: 'subscriptionStatus', value: filterSubStatus });
    if (filterPayStatus) filterConfig.push({ key: 'paymentStatus', value: filterPayStatus });
    if (filterSalesId) filterConfig.push({ key: 'assignedSalesId', value: filterSalesId });

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
        data: baseList,
        searchQuery: filterName,
        searchFields: ['name', 'accountId'],
        filterConfig,
        initialSortKey: 'joinedAt',
        initialSortDirection: 'desc',
        itemsPerPage: 10
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof typeof baseList[0] }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">고객 관리</h2>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={filterName}
                            onChange={setFilterName}
                            placeholder="고객명 또는 Account ID 검색..."
                        />
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
                        <SelectFilter
                            value={filterSubStatus}
                            onChange={setFilterSubStatus}
                            placeholder="구독 상태 전체"
                            options={Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                            className="w-full md:w-36"
                        />
                        <SelectFilter
                            value={filterPayStatus}
                            onChange={setFilterPayStatus}
                            placeholder="결제 상태 전체"
                            options={Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                            className="w-full md:w-36"
                        />
                        {(currentRole === 'ADMIN' || currentRole === 'MANAGER') && (
                            <SelectFilter
                                value={filterSalesId}
                                onChange={setFilterSalesId}
                                placeholder="담당 영업자 전체"
                                options={sales.map(s => ({ label: s.name, value: s.salesId }))}
                                className="w-full md:w-40"
                            />
                        )}
                    </div>
                </div>
            </Card>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                고객명 <SortIcon columnKey="name" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('accountId')}>
                                Account ID <SortIcon columnKey="accountId" />
                            </Th>
                            <Th>업종</Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('subscriptionStatus')}>
                                구독 상태 <SortIcon columnKey="subscriptionStatus" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('paymentStatus')}>
                                결제 상태 <SortIcon columnKey="paymentStatus" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('joinedAt')}>
                                가입일 <SortIcon columnKey="joinedAt" />
                            </Th>
                            <Th>담당 영업자</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(item => (
                            <Tr key={item.customerId} onClick={() => navigate(`/customers/${item.customerId}`)} className="cursor-pointer hover:bg-gray-50">
                                <Td className="font-medium text-gray-900">{item.name}</Td>
                                <Td>{item.accountId}</Td>
                                <Td className="text-gray-500">{item.industry}</Td>
                                <Td>
                                    {item.subscriptionStatus ? (
                                        <StatusBadge status={item.subscriptionStatus} label={SUBSCRIPTION_STATUS_LABELS[item.subscriptionStatus]} type="subscription" />
                                    ) : '-'}
                                </Td>
                                <Td>
                                    {item.paymentStatus ? (
                                        <StatusBadge status={item.paymentStatus} label={PAYMENT_STATUS_LABELS[item.paymentStatus]} type="payment" />
                                    ) : '-'}
                                </Td>
                                <Td className="text-gray-500">{format(new Date(item.joinedAt), 'yyyy-MM-dd')}</Td>
                                <Td className="text-gray-500">{item.salesName}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState />
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
