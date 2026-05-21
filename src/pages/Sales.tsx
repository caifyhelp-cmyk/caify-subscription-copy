import React, { useState } from 'react';
import { useSalesStore } from '../state/sales';
import { useCustomerStore } from '../state/customers';
import { usePaymentStore } from '../state/payments';
import { useSubscriptionStore } from '../state/subscriptions';
import { useAuthStore } from '../state/auth';
import { useTableData } from '../state/table/useTableData';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Drawer } from '../components/ui/Drawer';
import { SearchInput } from '../components/ui/SearchInput';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { SUBSCRIPTION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../constants/labels';
import { Navigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Sales as SalesType } from '../mock/types';

export const Sales: React.FC = () => {
    const { sales, baseCommissionRate, updateBaseCommissionRate } = useSalesStore();
    const { customers } = useCustomerStore();
    const { payments } = usePaymentStore();
    const { subscriptions } = useSubscriptionStore();
    const { currentRole } = useAuthStore();

    const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'PERFORMANCE' | 'SETTLEMENTS'>('CUSTOMERS');
    const [searchQuery, setSearchQuery] = useState('');

    // Global Rate Edit State
    const [isEditingGlobalRate, setIsEditingGlobalRate] = useState(false);
    const [globalRateInput, setGlobalRateInput] = useState('');

    if (currentRole !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    const baseSales = sales.map(s => {
        const assignedCusts = customers.filter(c => c.assignedSalesId === s.salesId);
        const assignedCustIds = new Set(assignedCusts.map(c => c.customerId));

        const assignedPayments = payments.filter(p => assignedCustIds.has(p.customerId) && p.status === 'PAID');
        const totalRev = assignedPayments.reduce((acc, p) => acc + p.amount, 0);

        return {
            ...s,
            totalCustomers: assignedCusts.length,
            totalRevenue: totalRev,
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
    } = useTableData<SalesType & { totalCustomers: number, totalRevenue: number }>({
        data: baseSales,
        searchQuery,
        searchFields: ['name'],
        initialSortKey: 'totalRevenue',
        initialSortDirection: 'desc',
        itemsPerPage: 10
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof (SalesType & { totalCustomers: number, totalRevenue: number }) }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    const selectedSales = baseSales.find(s => s.salesId === selectedSalesId);
    const selectedSalesCustomers = customers.filter(c => c.assignedSalesId === selectedSalesId);

    const handleGlobalRateSave = () => {
        const val = parseFloat(globalRateInput);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            updateBaseCommissionRate(val / 100, currentRole, 'Admin');
            setIsEditingGlobalRate(false);
        } else {
            alert('올바른 요율(0~100)을 입력하세요.');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">영업점 관리</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="p-5 bg-white border border-gray-200 md:col-span-2 flex items-center">
                    <div className="w-full md:w-1/2">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="영업자명 검색..."
                        />
                    </div>
                </Card>

                <Card className="p-5 bg-indigo-50 border border-indigo-100 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-bold text-indigo-900">전역 기본 수수료율</h3>
                        {!isEditingGlobalRate ? (
                            <button onClick={() => { setIsEditingGlobalRate(true); setGlobalRateInput((baseCommissionRate * 100).toString()); }} className="text-xs bg-white text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 font-semibold">변경</button>
                        ) : (
                            <div className="flex gap-1">
                                <button onClick={handleGlobalRateSave} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 font-semibold">저장</button>
                                <button onClick={() => setIsEditingGlobalRate(false)} className="text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 font-semibold">취소</button>
                            </div>
                        )}
                    </div>
                    {!isEditingGlobalRate ? (
                        <p className="text-2xl font-extrabold text-indigo-700">{(baseCommissionRate * 100).toFixed(1)}%</p>
                    ) : (
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="number"
                                className="w-24 px-2 py-1 text-base font-semibold border border-indigo-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                value={globalRateInput}
                                onChange={(e) => setGlobalRateInput(e.target.value)}
                                placeholder="%"
                            />
                            <span className="text-lg font-bold text-indigo-700">%</span>
                        </div>
                    )}
                </Card>
            </div>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                영업자명 <SortIcon columnKey="name" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('phone')}>
                                전화번호 <SortIcon columnKey="phone" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalCustomers')}>
                                담당 고객 수 <SortIcon columnKey="totalCustomers" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalRevenue')}>
                                총 매출 (연 누적) <SortIcon columnKey="totalRevenue" />
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(item => (
                            <Tr key={item.salesId} onClick={() => setSelectedSalesId(item.salesId)} className="cursor-pointer hover:bg-gray-50">
                                <Td className="font-medium text-gray-900">{item.name}</Td>
                                <Td className="text-gray-500">{item.phone}</Td>
                                <Td className="text-gray-600">{item.totalCustomers.toLocaleString()}명</Td>
                                <Td className="text-indigo-600 font-semibold">{item.totalRevenue.toLocaleString()}원</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState description="조건에 맞는 영업자가 없습니다." />
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </Card>

            <Drawer
                isOpen={selectedSalesId !== null}
                onClose={() => { setSelectedSalesId(null); setActiveTab('CUSTOMERS'); }}
                title="영업자 상세 정보"
            >
                {selectedSales && (
                    <div className="flex flex-col h-full -mx-4 sm:-mx-6 px-4 sm:px-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{selectedSales.name}</h3>
                            <p className="text-sm text-gray-500">{selectedSales.phone} / {selectedSales.salesId}</p>
                        </div>

                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {[
                                    { id: 'CUSTOMERS', name: '담당 고객' },
                                    { id: 'PERFORMANCE', name: '성과 요약' },
                                    { id: 'SETTLEMENTS', name: '정산 내역' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`
                                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                            ${activeTab === tab.id
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }
                                        `}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="pt-6 flex-1 overflow-y-auto">
                            {activeTab === 'CUSTOMERS' && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 text-indigo-800 text-xs p-3 rounded flex items-start border border-indigo-100">
                                        ℹ️ 관리 중인 고객 목록입니다. 고객 할당은 가입 시 매핑되거나 관리자가 등록합니다.
                                    </div>
                                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">고객명</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">가입일</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedSalesCustomers.map(c => {
                                                    const sub = subscriptions.find(s => s.customerId === c.customerId);
                                                    const pay = payments.filter(p => p.customerId === c.customerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
                                                    return (
                                                        <tr key={c.customerId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                                            <td className="px-4 py-3 flex gap-1">
                                                                <StatusBadge status={sub?.status || ''} label={SUBSCRIPTION_STATUS_LABELS[sub?.status || ''] || '-'} type="subscription" />
                                                                <StatusBadge status={pay?.status || ''} label={PAYMENT_STATUS_LABELS[pay?.status || ''] || '-'} type="payment" />
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(c.joinedAt), 'yy/MM/dd')}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {selectedSalesCustomers.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">담당 고객이 없습니다.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'PERFORMANCE' && (
                                <div className="space-y-6">
                                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <Card className="px-4 py-5 bg-white border border-gray-100 shadow-sm">
                                            <dt className="truncate text-sm font-medium text-gray-500">총 관리 고객 수</dt>
                                            <dd className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{selectedSales.totalCustomers}명</dd>
                                        </Card>
                                        <Card className="px-4 py-5 bg-white border border-gray-100 shadow-sm">
                                            <dt className="truncate text-sm font-medium text-gray-500">누적 매출액 (확정)</dt>
                                            <dd className="mt-2 text-3xl font-semibold tracking-tight text-indigo-600">{selectedSales.totalRevenue.toLocaleString()}원</dd>
                                        </Card>
                                    </dl>
                                </div>
                            )}

                            {activeTab === 'SETTLEMENTS' && (
                                <div className="text-center py-12 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                    <p className="mb-2 font-medium text-gray-900">당월 정산 예정 내역</p>
                                    <p className="text-gray-600 mb-4 cursor-pointer hover:underline text-lg">
                                        {(selectedSales.totalRevenue * 0.1).toLocaleString()}원
                                    </p>
                                    <p className="text-xs text-gray-400 p-2 bg-gray-100 inline-block rounded">
                                        기준: 누적 매출 * 기본 커미션 요율(10%)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};
