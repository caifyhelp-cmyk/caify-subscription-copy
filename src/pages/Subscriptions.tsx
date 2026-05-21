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
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Check, X } from 'lucide-react';

export const Subscriptions: React.FC = () => {
    const { subscriptions, updateSubscriptionStatus } = useSubscriptionStore();
    const { getCustomersVisibleToRole, customers } = useCustomerStore();
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    const visibleCustomers = getCustomersVisibleToRole(currentRole, currentSalesId);
    const visibleCustomerIds = new Set(visibleCustomers.map(c => c.customerId));

    const baseSubs = subscriptions
        .filter(s => visibleCustomerIds.has(s.customerId))
        .map(s => {
            const customer = customers.find(c => c.customerId === s.customerId);
            return { ...s, customerName: customer?.name || 'Unknown' };
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

    const startEdit = (subscriptionId: string, currentStatus: string) => {
        setEditingId(subscriptionId);
        setEditingValue(currentStatus);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingValue('');
    };

    const saveEdit = (subscriptionId: string) => {
        updateSubscriptionStatus(subscriptionId, editingValue as SubscriptionStatus, currentRole, 'Current User');
        setEditingId(null);
        setEditingValue('');
    };

    const handleActionChange = (subscriptionId: string, status: string) => {
        updateSubscriptionStatus(subscriptionId, status as SubscriptionStatus, currentRole, 'Current User');
    };

    const canEdit = currentRole !== 'SALES';

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
                                    {editingId === s.subscriptionId ? (
                                        <div className="flex items-center gap-1">
                                            <select
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                className="rounded-md border-0 py-1 text-gray-900 ring-1 ring-inset ring-indigo-400 px-2 text-sm focus:ring-2 focus:ring-indigo-600 w-28"
                                                autoFocus
                                            >
                                                {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([k, v]) => (
                                                    <option key={k} value={k}>{v}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => saveEdit(s.subscriptionId)}
                                                className="p-1 rounded text-white bg-indigo-600 hover:bg-indigo-700"
                                                title="저장"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                title="취소"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 group">
                                            <StatusBadge status={s.status} label={SUBSCRIPTION_STATUS_LABELS[s.status] || s.status} type="subscription" />
                                            {canEdit && (
                                                <button
                                                    onClick={() => startEdit(s.subscriptionId, s.status)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                    title="상태 수정"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </Td>
                                <Td className="text-gray-500">{format(new Date(s.startAt), 'yyyy-MM-dd')}</Td>
                                <Td className="text-gray-500">{format(new Date(s.nextBillingAt), 'yyyy-MM-dd')}</Td>
                                <Td>
                                    <select
                                        value={s.status}
                                        onChange={(e) => handleActionChange(s.subscriptionId, e.target.value)}
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