import React, { useState } from 'react';
import { useInquiryStore } from '../state/inquiries';
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
import { INQUIRY_STATUS_LABELS } from '../constants/labels';
import { Drawer } from '../components/ui/Drawer';
import { format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Inquiry } from '../mock/types';

export const Inquiries: React.FC = () => {
    const { inquiries, updateInquiryStatus } = useInquiryStore();
    const { getCustomersVisibleToRole, customers } = useCustomerStore();
    const { currentRole, currentSalesId } = useAuthStore();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

    // States for Answer Edit
    const [answerDraft, setAnswerDraft] = useState('');
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);

    // Derive list with customerName
    const visibleCustomers = getCustomersVisibleToRole(currentRole, currentSalesId);
    const visibleCustomerIds = new Set(visibleCustomers.map(c => c.customerId));

    const baseInquiries = inquiries
        .filter(i => visibleCustomerIds.has(i.customerId))
        .map(i => {
            const c = customers.find(c => c.customerId === i.customerId);
            return { ...i, customerName: c?.name || '알 수 없음' } as Inquiry & { customerName: string };
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
    } = useTableData<Inquiry & { customerName: string }>({
        data: baseInquiries,
        searchQuery,
        searchFields: ['title', 'customerName'],
        filterConfig: filterStatus ? [{ key: 'status', value: filterStatus }] : [],
        initialSortKey: 'createdAt',
        initialSortDirection: 'desc',
        itemsPerPage: 10
    });

    const SortIcon = ({ columnKey }: { columnKey: keyof (Inquiry & { customerName: string }) }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-4 w-4 text-indigo-600 inline" />
            : <ArrowDown className="ml-1 h-4 w-4 text-indigo-600 inline" />;
    };

    const selectedInquiry = baseInquiries.find(i => i.inquiryId === selectedInquiryId);

    const handleRowClick = (inqId: string) => {
        setSelectedInquiryId(inqId);
        const inq = inquiries.find(i => i.inquiryId === inqId);
        if (inq?.answer) {
            setAnswerDraft(inq.answer.content);
            setIsEditingAnswer(false);
        } else {
            setAnswerDraft('');
            setIsEditingAnswer(true);
        }
    };

    const handleSaveAnswer = () => {
        if (!selectedInquiry || !answerDraft.trim()) return;
        updateInquiryStatus(selectedInquiry.inquiryId, 'ANSWERED', answerDraft, currentRole, 'Current User');
        setIsEditingAnswer(false);
    };

    const handleResendNotification = () => {
        if (!selectedInquiry) return;
        alert('카카오 알림톡을 재전송했습니다! (Mock)');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">문의 관리</h2>

            <Card className="p-4 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="문의 제목 또는 고객명 검색..."
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <SelectFilter
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="상태 전체"
                            options={Object.entries(INQUIRY_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                        />
                    </div>
                </div>
            </Card>

            <Card className="bg-white">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('title')}>
                                문의 제목 <SortIcon columnKey="title" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('customerName')}>
                                고객명 <SortIcon columnKey="customerName" />
                            </Th>
                            <Th className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                                답변 여부 <SortIcon columnKey="status" />
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {paginatedList.map(item => (
                            <Tr key={item.inquiryId} onClick={() => handleRowClick(item.inquiryId)} className="cursor-pointer hover:bg-gray-50">
                                <Td className="font-medium text-gray-900 truncate max-w-sm">{item.title}</Td>
                                <Td className="text-gray-600">{item.customerName}</Td>
                                <Td className="text-gray-500">{format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}</Td>
                                <Td>
                                    <StatusBadge status={item.status} label={INQUIRY_STATUS_LABELS[item.status] || item.status} type="inquiry" />
                                </Td>
                                <Td className="text-gray-500 font-medium">
                                    {item.status === 'ANSWERED' ? <span className="text-emerald-600">O (작성됨)</span> : <span className="text-gray-400">X (미답변)</span>}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                {paginatedList.length === 0 && (
                    <EmptyState description="조건에 맞는 문의 내역이 없습니다." />
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
                isOpen={selectedInquiryId !== null}
                onClose={() => setSelectedInquiryId(null)}
                title="문의 상세"
            >
                {selectedInquiry && (
                    <div className="space-y-6">
                        <section className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{selectedInquiry.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{selectedInquiry.customerName} · {selectedInquiry.type} · {format(new Date(selectedInquiry.createdAt), 'yyyy-MM-dd HH:mm')}</p>
                                </div>
                                <StatusBadge status={selectedInquiry.status} label={INQUIRY_STATUS_LABELS[selectedInquiry.status]} type="inquiry" />
                            </div>
                            <div className="mt-4 prose prose-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">
                                {selectedInquiry.content}
                            </div>
                        </section>

                        <section className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100">
                            <h3 className="text-md font-semibold text-gray-900 mb-4 flex justify-between items-center">
                                <span>답변 영역</span>
                                {selectedInquiry.answer && !isEditingAnswer && (
                                    <button
                                        onClick={() => setIsEditingAnswer(true)}
                                        className="text-indigo-600 text-sm font-medium hover:underline"
                                    >
                                        수정
                                    </button>
                                )}
                            </h3>

                            {isEditingAnswer && currentRole !== 'SALES' ? (
                                <div className="space-y-3">
                                    <textarea
                                        rows={5}
                                        className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="답변을 작성하세요..."
                                        value={answerDraft}
                                        onChange={e => setAnswerDraft(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsEditingAnswer(false)}
                                            className="rounded bg-white px-3 py-1.5 text-sm outline-none font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleSaveAnswer}
                                            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        >
                                            저장
                                        </button>
                                    </div>
                                </div>
                            ) : selectedInquiry.answer ? (
                                <div className="space-y-4">
                                    <div className="prose prose-sm text-gray-700 whitespace-pre-wrap p-4 bg-white rounded border border-gray-100">
                                        {selectedInquiry.answer.content}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>작성: {selectedInquiry.answer.authorRole} · {format(new Date(selectedInquiry.answer.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                                        {currentRole !== 'SALES' && (
                                            <button
                                                onClick={handleResendNotification}
                                                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                                            >
                                                알림톡 재전송
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-gray-500 bg-white rounded border border-dashed border-gray-300">
                                    아직 작성된 답변이 없습니다.
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </Drawer>
        </div>
    );
};
