import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSalesDbStore } from '../state/salesDb';
import { useAuthStore } from '../state/auth';
import { useTableData } from '../state/table/useTableData';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { SelectFilter } from '../components/ui/SelectFilter';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SalesLead } from '../mock/types';

export const SalesLeads: React.FC = () => {
    const { getLeadsVisibleToRole } = useSalesDbStore();
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Access guard: MANAGER is blocked
    if (currentRole === 'MANAGER') {
        return <Navigate to="/" replace />;
    }

    const baseLeads = getLeadsVisibleToRole(currentRole, currentSalesId);

    const {
        paginatedData: paginatedList,
        totalItems,
        totalPages,
        currentPage,
        setCurrentPage,
        sortConfig,
        handleSort,
        itemsPerPage
    } = useTableData<SalesLead>({
        data: baseLeads,
        searchQuery,
        searchFields: ['customerName', 'customerPhone'],
        filterConfig: filterStatus ? [{ key: 'status', value: filterStatus }] : [],
        initialSortKey: 'createdAt',
        initialSortDirection: 'desc',
        itemsPerPage: 10
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof SalesLead }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    const getStatusBadge = (status: SalesLead['status']) => {
        switch (status) {
            case 'CONTACTED': return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md text-xs font-semibold">연락 완료</span>;
            case 'TRIAL': return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-semibold">체험판 제공</span>;
            case 'CONVERTED': return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-semibold">계약 완료</span>;
            case 'DROPPED': return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-md text-xs font-semibold">드랍 (종료)</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">영업점 DB (Sales Leads)</h2>
                {(currentRole === 'SALES' || currentRole === 'ADMIN') && (
                    <button
                        onClick={() => navigate('/sales-leads/new')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
                    >
                        신규 영업 DB 등록
                    </button>
                )}
            </div>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="고객명 또는 연락처 검색..."
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <SelectFilter
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="상태 범주 전체"
                            options={[
                                { label: '연락 완료', value: 'CONTACTED' },
                                { label: '체험판 제공', value: 'TRIAL' },
                                { label: '계약 완료', value: 'CONVERTED' },
                                { label: '드랍 (종료)', value: 'DROPPED' }
                            ]}
                        />
                    </div>
                </div>
            </Card>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                                등록일 <SortIcon columnKey="createdAt" />
                            </Th>
                            <Th className="cursor-pointer" onClick={() => handleSort('customerName')}>
                                가망 고객사명 <SortIcon columnKey="customerName" />
                            </Th>
                            <Th>고객 연락처</Th>
                            <Th className="cursor-pointer" onClick={() => handleSort('industry')}>
                                업종 <SortIcon columnKey="industry" />
                            </Th>
                            <Th>담당 영업자</Th>
                            <Th className="cursor-pointer" onClick={() => handleSort('status')}>
                                현재 상태 <SortIcon columnKey="status" />
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(item => (
                            <Tr key={item.leadId} onClick={() => navigate(`/sales-leads/${item.leadId}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                                <Td className="text-gray-500">{format(new Date(item.createdAt), 'yyyy-MM-dd')}</Td>
                                <Td className="font-bold text-gray-900">{item.customerName}</Td>
                                <Td className="text-gray-600 font-mono text-xs">{item.customerPhone}</Td>
                                <Td className="text-gray-500">{item.industry}</Td>
                                <Td className="text-gray-600">{item.salesName}</Td>
                                <Td>{getStatusBadge(item.status)}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState description="등록된 영업 DB 내역이 없습니다." />
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
