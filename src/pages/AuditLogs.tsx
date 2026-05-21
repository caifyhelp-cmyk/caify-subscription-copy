import React, { useState } from 'react';
import { useAuditLogStore } from '../state/auditLogs';
import { useAuthStore } from '../state/auth';
import { useTableData } from '../state/table/useTableData';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { SelectFilter } from '../components/ui/SelectFilter';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { format, parseISO } from 'date-fns';
import { Navigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { AuditLog } from '../mock/types';

export const AuditLogs: React.FC = () => {
    const auditLogs = useAuditLogStore(state => state.auditLogs);
    const { currentRole } = useAuthStore();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Access check: only ADMIN allowed
    if (currentRole !== 'ADMIN') {
        return <Navigate to="/" replace />;
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
    } = useTableData<AuditLog>({
        data: auditLogs,
        searchQuery,
        searchFields: ['actionType', 'actorName', 'targetType'],
        filterConfig: filterRole ? [{ key: 'actorRole', value: filterRole }] : [],
        initialSortKey: 'timestamp',
        initialSortDirection: 'desc',
        itemsPerPage: 15
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof AuditLog }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">감사 로그 (Audit Logs)</h2>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="작업자명, 액션 타입, 대상 등 검색..."
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <SelectFilter
                            value={filterRole}
                            onChange={setFilterRole}
                            placeholder="권한별 조회 전체"
                            options={[
                                { label: 'ADMIN', value: 'ADMIN' },
                                { label: 'MANAGER', value: 'MANAGER' },
                                { label: 'SALES', value: 'SALES' },
                                { label: 'SYSTEM', value: 'SYSTEM' }
                            ]}
                        />
                    </div>
                </div>
            </Card>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('timestamp')}>
                                발생 일시 <SortIcon columnKey="timestamp" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('actionType')}>
                                액션 <SortIcon columnKey="actionType" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('actorName')}>
                                작업자 (권한) <SortIcon columnKey="actorName" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('targetType')}>
                                대상 <SortIcon columnKey="targetType" />
                            </Th>
                            <Th>변경 로그 상세</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(log => {
                            const changeSummary = log.after ? JSON.stringify(log.after) : JSON.stringify(log.meta || {});
                            return (
                                <Tr key={log.id} className="hover:bg-gray-50">
                                    <Td className="whitespace-nowrap text-gray-500">{format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</Td>
                                    <Td className="font-semibold text-indigo-600 break-words whitespace-normal">{log.actionType}</Td>
                                    <Td className="text-gray-800 font-medium">
                                        {log.actorName} <span className="text-gray-400 font-normal text-xs ml-1 bg-gray-100 px-1 rounded">{log.actorRole}</span>
                                    </Td>
                                    <Td className="text-gray-500 font-medium">
                                        {log.targetType} <span className="text-xs text-gray-400 font-normal ml-1 border rounded px-1">ID: {log.targetId.slice(0, 8)}...</span>
                                    </Td>
                                    <Td className="text-xs text-gray-500 font-mono break-words whitespace-normal max-w-sm overflow-hidden bg-gray-50 p-2 rounded border border-gray-100 m-2 inline-block">
                                        {changeSummary === '{}' ? '변경 내용 없음 / 상세 생략' : changeSummary}
                                    </Td>
                                </Tr>
                            )
                        })}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState description="조건에 일치하는 로그 기록이 없습니다." />
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
