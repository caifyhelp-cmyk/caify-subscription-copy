import type { Customer, Subscription, Payment, Inquiry, Sales, AuditLog, SalesLead } from './types';
import { subDays, formatISO } from 'date-fns';

const now = new Date();

export const mockSales: Sales[] = [
    { salesId: 'sales_001', name: '김태형', phone: '010-1234-5678' },
    { salesId: 'sales_002', name: '이민호', phone: '010-2345-6789' },
    { salesId: 'sales_003', name: '박서준', phone: '010-3456-7890' },
];

export const mockSalesLeads: SalesLead[] = [
    {
        leadId: 'lead_001',
        salesId: 'sales_001',
        salesName: '김태형',
        salesPhone: '010-1234-5678',
        customerName: '(주)고객사1',
        customerPhone: '010-1111-2222',
        industry: 'IT/Software',
        trialGrantFlag: true,
        status: 'CONVERTED',
        createdAt: formatISO(subDays(now, 10))
    },
    {
        leadId: 'lead_002',
        salesId: 'sales_002',
        salesName: '이민호',
        salesPhone: '010-2345-6789',
        customerName: '(주)고객사2',
        customerPhone: '010-2222-3333',
        industry: 'Manufacturing',
        trialGrantFlag: true,
        status: 'TRIAL',
        createdAt: formatISO(subDays(now, 5))
    }
];

export const mockCustomers: Customer[] = Array.from({ length: 30 }).map((_, i) => {
    let assignedSalesId: string | null = null;
    let trialCount = 0;
    let serviceStatus: Customer['serviceStatus'] = 'ACTIVE';

    if (i === 0) { // Matches lead_001
        assignedSalesId = 'sales_001';
        serviceStatus = 'ACTIVE';
    } else if (i === 1) { // Matches lead_002
        assignedSalesId = 'sales_002';
        serviceStatus = 'TRIAL';
        trialCount = 8;
    } else if (i < 15) {
        assignedSalesId = mockSales[i % 3].salesId;
    }

    return {
        customerId: `cust_${String(i + 1).padStart(3, '0')}`,
        name: `(주)고객사${i + 1}`,
        industry: ['IT/Software', 'Manufacturing', 'Retail', 'Healthcare', 'Finance'][i % 5],
        contact: `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
        accountId: `acc_${String(i + 1).padStart(3, '0')}`,
        joinedAt: formatISO(subDays(now, Math.floor(Math.random() * 365))),
        assignedSalesId,
        serviceStatus,
        trialCount,
        memo: i === 0 ? 'VIP 고객. 특별 관리 요망.' : undefined
    };
});

export const CAIFY_PRODUCTS = [
    '블로그 자동화',
    '연동형 홈페이지',
    '블로그 자동화 + 연동형 홈페이지'
];

export const mockSubscriptions: Subscription[] = mockCustomers.map((c, i) => {
    let status: Subscription['status'] = c.serviceStatus === 'TRIAL' ? 'TRIAL' : 'ACTIVE';
    if (i === 10) status = 'SUSPENDED';
    if (i === 15) status = 'CANCELLED';

    const product = CAIFY_PRODUCTS[i % 3];

    return {
        subscriptionId: `sub_${c.customerId}`,
        customerId: c.customerId,
        product,
        status,
        startAt: c.joinedAt,
        endAt: formatISO(subDays(now, -30)), // 30 days in future roughly
        nextBillingAt: formatISO(subDays(now, -15)),
    };
});

export const mockPayments: Payment[] = [];
for (let i = 0; i < 80; i++) {
    const customer = mockCustomers[i % 30];
    const subscription = mockSubscriptions[i % 30];
    let status: Payment['status'] = 'PAID';

    if (subscription.status === 'TRIAL') continue; // No payment for trial

    if (customer.customerId === 'cust_021' && i > 60) {
        status = 'FAILED';
    }
    if (i === 75 || i === 76) {
        status = 'REFUND';
    }

    const amount = subscription.product === '블로그 자동화 + 연동형 홈페이지' ? 550000 : 330000;

    mockPayments.push({
        paymentId: `pay_${String(i + 1).padStart(3, '0')}`,
        customerId: customer.customerId,
        salesId: customer.assignedSalesId,
        subscriptionId: subscription.subscriptionId,
        amount,
        currency: 'KRW',
        status,
        paidAt: formatISO(subDays(now, Math.floor(Math.random() * 90))),
        method: i % 4 === 0 ? 'TRANSFER' : 'CARD',
        billingCycleNo: Math.floor(i / 30) + 1,
    });
}

export const mockInquiries: Inquiry[] = Array.from({ length: 50 }).map((_, i) => {
    const customer = mockCustomers[i % 30];
    const isAnswered = i % 3 !== 0; // 2/3 answered
    const status: Inquiry['status'] = isAnswered ? 'ANSWERED' : 'OPEN';

    return {
        inquiryId: `inq_${String(i + 1).padStart(3, '0')}`,
        customerId: customer.customerId,
        title: `서비스 이용 관련 문의 ${i + 1}`,
        content: `이러이러한 기능은 어떻게 사용하나요?\n빠른 답변 부탁드립니다.`,
        type: ['결제', '기술지원', '계정', '기타'][i % 4],
        createdAt: formatISO(subDays(now, Math.floor(Math.random() * 30))),
        status,
        answer: isAnswered
            ? {
                content: '안녕하세요. 고객님 문의하신 내용에 대해 답변 드립니다.',
                authorRole: 'ADMIN',
                createdAt: formatISO(subDays(now, Math.floor(Math.random() * 20))),
                updatedAt: formatISO(subDays(now, Math.floor(Math.random() * 20))),
            }
            : undefined,
    };
});

export const mockAuditLogs: AuditLog[] = [
    {
        id: 'audit_001',
        actorRole: 'ADMIN',
        actorName: 'Admin User',
        actionType: 'UPDATE_SUBSCRIPTION',
        targetType: 'SUBSCRIPTION',
        targetId: 'sub_cust_011',
        meta: {
            prevStatus: 'ACTIVE',
            newStatus: 'SUSPENDED'
        },
        timestamp: formatISO(subDays(now, 1)),
    },
];