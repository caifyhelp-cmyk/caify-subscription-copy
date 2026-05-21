export type Role = 'ADMIN' | 'MANAGER' | 'SALES';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAYMENT_FAILED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PAID'
  | 'FAILED'
  | 'PENDING'
  | 'REFUND'
  | 'REFUND_REQUESTED';

export type InquiryStatus = 'OPEN' | 'ANSWERED';
export type ServiceStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'FREE';

export interface Customer {
  customerId: string;
  name: string; // 고객명
  industry: string; // 업종
  contact: string;
  accountId: string;
  joinedAt: string; // ISO date string
  assignedSalesId: string | null;
  serviceStatus?: ServiceStatus;
  trialEndDate?: string;
  trialCount?: number;
  prompt?: string;
  memo?: string;
}

export interface SalesLead {
  leadId: string;
  salesId: string; // 기준 키
  salesName: string; // 표시/서치용
  salesPhone: string; // 표시/서치용
  customerName: string;
  customerPhone: string; // 매칭용 고객 번호
  industry: string;
  trialGrantFlag: boolean;
  status: 'CONTACTED' | 'TRIAL' | 'CONVERTED' | 'DROPPED';
  createdAt: string;
}

export interface Subscription {
  subscriptionId: string;
  customerId: string;
  product: string;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string;
  nextBillingAt: string;
}

export interface Payment {
  paymentId: string;
  customerId: string;
  salesId: string | null;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string;
  method: string;
  billingCycleNo: number;
}

export interface Answer {
  content: string;
  authorRole: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  inquiryId: string;
  customerId: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  status: InquiryStatus;
  answer?: Answer;
}

export interface Sales {
  salesId: string;
  name: string;
  phone: string;
  commissionRate?: number; // Override rate, e.g., 0.07 for 7%
}

export interface Settlement {
  settlementId: string; // Maps 1:1 to paymentId conceptually or uses stl_paymentId
  salesId: string;
  paymentId: string;
  customerId: string;
  customerName: string;
  product: string;
  paymentAmount: number;
  commissionRate: number;
  amount: number; // calculated commission amount
  paidAt: string; // ISO date of payment
  status: 'PENDING' | 'ON_HOLD' | 'PAID';
}

export type AuditActionType =
  | 'UPDATE_CUSTOMER_STATUS' // 고객 상태 변경
  | 'UPDATE_CUSTOMER_PRODUCT' // 상품 변경
  | 'UPDATE_CUSTOMER_ROLE' // 권한 변경
  | 'GRANT_TRIAL' // 체험판 부여
  | 'CONSUME_TRIAL' // 체험판 차감
  | 'PROCESS_PAYMENT' // 결제 반영
  | 'PROCESS_REFUND' // 환불 처리
  | 'UPDATE_INQUIRY_ANSWER' // 문의 답변 수정
  | 'CREATE_SALES_LEAD'
  | 'UPDATE_SALES_LEAD_STATUS'
  | 'CUSTOMER_REGISTER'
  | 'UPDATE_CUSTOMER_INFO'
  | 'UPDATE_COMMISSION_RATE' // 요율 변경
  | 'CREATE_SETTLEMENT' // 정산 예정 생성
  | 'COMPLETE_SETTLEMENT' // 정산 완료
  | 'DEDUCT_SETTLEMENT' // 환불 차감 반영
  | string;

export interface AuditLog {
  id: string;
  actorRole: Role;
  actorName: string;
  actionType: AuditActionType;
  targetType: 'PAYMENT' | 'SUBSCRIPTION' | 'INQUIRY' | 'CUSTOMER' | 'SALES' | 'SALES_LEAD' | string;
  targetId: string;
  meta?: {
    amount?: number;
    prevStatus?: string;
    newStatus?: string;
    reason?: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
    [key: string]: any;
  };
  before?: any;
  after?: any;
  timestamp: string;
}
