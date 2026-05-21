import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../state/subscriptions';
import { useCustomerStore } from '../state/customers';
import { useAuthStore } from '../state/auth';
import { useTableData } from '../state/table/useTableData';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { SelectFilter } from '../components/ui/SelectFilter';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SUBSCRIPTION_STATUS_LABELS } from '../constants/labels';
import { format } from 'date-fns';
import type { SubscriptionStatus } from '../mock/types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const Subscriptions: React.FC = () => {
    const { subscriptions, updateSubscriptionStatus } = useSubscriptionStore();
    const { getCustomersVisibleToRole, customers } = useCustomerStore();
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const visibleCustomers = getCustomersVisibleToRole(currentRole, currentSalesId);
    const visibleCustomerIds = new Set(visibleCustomers.map(c => c.customerId));

    const baseSubs = subscriptions
        .filter(s => visibleCustomerIds.has(s.customerId))
        .map(s => {
            const customer = customers.find(c => c.customerId === s.customerId);
            return {
                ...s,
                customerName: customer?.name || 'Unknown',
            };
        });

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
        data: baseSubs,
        searchQuery,
        searchFields: ['customerName', 'product'],
        filterConfig: filterStatus ? [{ key: 'status', value: filterStatus }] : [],
        initialSortKey: 'startAt',
        initialSortDirection: 'desc',
        itemsPerPage: 10
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof typeof baseSubs[0] }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    const handleStatusChange = (subscriptionId: string, status: string) => {
        updateSubscriptionStatus(subscriptionId, status as SubscriptionStatus, currentRole, 'Current User');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">구독 관리</h2>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="고객명 또는 상품명 검색..."
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <SelectFilter
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="구독 상태 전체"
                            options={Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                        />
                    </div>
                </div>
            </Card>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('customerName')}>
                                고객명 <SortIcon columnKey="customerName" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('product')}>
                                상품 <SortIcon columnKey="product" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                                상태 <SortIcon columnKey="status" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('startAt')}>
                                시작일 <SortIcon columnKey="startAt" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nextBillingAt')}>
                                다음 결제예정일 <SortIcon columnKey="nextBillingAt" />
                            </Th>
                            <Th>관리 액션</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(s => (
                            <Tr key={s.subscriptionId}>
                                <Td
                                    className="font-medium text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline"
                                    onClick={() => navigate(`/customers/${s.customerId}`)}
                                >
                                    {s.customerName}
                                </Td>
                                <Td className="text-gray-500">{s.product}</Td>
                                <Td>
                                    <StatusBadge status={s.status} label={SUBSCRIPTION_STATUS_LABELS[s.status] || s.status} type="subscription" />
                                </Td>
                                <Td className="text-gray-500">{format(new Date(s.startAt), 'yyyy-MM-dd')}</Td>
                                <Td className="text-gray-500">{format(new Date(s.nextBillingAt), 'yyyy-MM-dd')}</Td>
                                <Td>
                                    <select
                                        value={s.status}
                                        onChange={(e) => handleStatusChange(s.subscriptionId, e.target.value)}
                                        className="rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 w-32"
                                        disabled={currentRole === 'SALES'}
                                        title={currentRole === 'SALES' ? "영업 담당자는 상태를 변경할 수 없습니다." : "상태 변경"}
                                    >
                                        {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState description="조건에 맞는 구독 내역이 없습니다." />
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
