export const ROLE_LABELS: Record<string, string> = {
    ADMIN: '전체 관리자',
    MANAGER: '매니저 (운영)',
    SALES: '영업 담당자'
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
    TRIAL: '무료 체험',
    ACTIVE: '이용 중',
    PAYMENT_FAILED: '결제 실패',
    SUSPENDED: '일시 정지',
    CANCELLED: '해지됨'
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
    PAID: '결제 완료',
    FAILED: '결제 실패',
    PENDING: '결제 대기',
    REFUND: '환불 완료',
    REFUND_REQUESTED: '환불 요청'
};

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
    OPEN: '답변 대기',
    ANSWERED: '답변 완료'
};

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
    PENDING: '정산 대기',
    CONFIRMED: '정산 확정',
    PAID: '지급 완료'
};

export const BREADCRUMB_LABELS: Record<string, string> = {
    customers: '고객 관리',
    subscriptions: '구독 관리',
    payments: '결제 내역',
    inquiries: '문의 관리',
    sales: '영업점 관리',
    'sales-leads': '영업점 DB',
    'audit': '감사 로그',
    'analytics': '매출 분석'
};
