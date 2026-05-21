import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { usePaymentStore } from '../state/payments';
import { useInquiryStore } from '../state/inquiries';
import { useSalesStore } from '../state/sales';
import { useAuthStore } from '../state/auth';
import { useAuditLogStore } from '../state/auditLogs';
import { Card } from '../components/ui/Card';
import { clsx } from 'clsx';
import {
  Badge,
  getSubscriptionBadgeVariant,
  SubscriptionStatusKR,
  getPaymentBadgeVariant,
  PaymentStatusKR,
  getInquiryBadgeVariant,
  InquiryStatusKR,
} from '../components/ui/Badge';
import { format } from 'date-fns';
import { CAIFY_PRODUCTS } from '../mock/data';

type TabType = 'INFO' | 'PAYMENT' | 'SETTINGS' | 'LOGS';

export const CustomerDetail: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('INFO');

  const { currentRole } = useAuthStore();

  const { customers, updateCustomerField, consumeTrial } = useCustomerStore();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const updateSubscription = useSubscriptionStore((state) => state.updateSubscription);
  const allPayments = usePaymentStore((state) => state.payments);
  const allInquiries = useInquiryStore((state) => state.inquiries);
  const sales = useSalesStore((state) => state.sales);
  const auditLogs = useAuditLogStore(state => state.auditLogs);

  const customer = useMemo(() => {
    if (!customerId) return undefined;
    return customers.find((item) => item.customerId === customerId);
  }, [customers, customerId]);

  const subscription = useMemo(() => {
    if (!customerId) return undefined;
    return subscriptions.find((item) => item.customerId === customerId);
  }, [subscriptions, customerId]);

  const payments = useMemo(() => {
    if (!customerId) return [];
    return allPayments
      .filter((item) => item.customerId === customerId)
      .slice()
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }, [allPayments, customerId]);

  const inquiries = useMemo(() => {
    if (!customerId) return [];
    return allInquiries
      .filter((item) => item.customerId === customerId)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allInquiries, customerId]);

  const customerLogs = useMemo(() => {
    if (!customerId) return [];
    return auditLogs
      .filter(log => log.targetId === customerId || (subscription && log.targetId === subscription.subscriptionId))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [auditLogs, customerId, subscription]);

  const salesAgent = useMemo(() => {
    if (!customer?.assignedSalesId) return undefined;
    return sales.find((item) => item.salesId === customer.assignedSalesId);
  }, [sales, customer]);

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">고객 정보를 찾을 수 없습니다.</div>;
  }

  // Permissions
  const canEditStatus = currentRole === 'ADMIN' || currentRole === 'MANAGER';
  const canEditProduct = currentRole === 'ADMIN';
  const canEditMemo = currentRole === 'ADMIN' || currentRole === 'MANAGER' || (currentRole === 'SALES');
  const canConsumeTrial = (currentRole === 'ADMIN' || currentRole === 'MANAGER') && customer.trialCount && customer.trialCount > 0;

  const handleStatusChange = (newStatus: string) => {
    if (!canEditStatus) return;
    if (window.confirm(`고객 상태를 ${newStatus}로 변경하시겠습니까?`)) {
      updateCustomerField(customer.customerId, 'serviceStatus', newStatus, currentRole, 'System User');
    }
  };

  const handleProductChange = (newProduct: string) => {
    if (!canEditProduct || !subscription) return;
    if (window.confirm(`구독 상품을 ${newProduct}로 변경하시겠습니까?`)) {
      updateSubscription(subscription.subscriptionId, { product: newProduct }, currentRole, 'System User');
    }
  };

  const handleUpdateMemo = () => {
    const newMemo = window.prompt("메모를 입력하세요:", customer.memo || "");
    if (newMemo !== null && canEditMemo) {
      updateCustomerField(customer.customerId, 'memo', newMemo, currentRole, 'System User');
    }
  };

  const handleConsumeTrial = () => {
    if (canConsumeTrial) {
      if (window.confirm(`체험판 1회를 차감하시겠습니까? (현재 ${customer.trialCount}회)`)) {
        consumeTrial(customer.customerId, currentRole, 'System User');
      }
    }
  };

  const tabs: { id: TabType; name: string }[] = [
    { id: 'INFO', name: '회원 정보' },
    { id: 'PAYMENT', name: '결제 정보' },
    { id: 'SETTINGS', name: '권한 및 설정' },
    { id: 'LOGS', name: '활동 로그' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{customer.name} 상세 정보</h2>
        <Badge variant={customer.serviceStatus === 'ACTIVE' ? 'success' : customer.serviceStatus === 'TRIAL' ? 'warning' : 'default'}>
          {customer.serviceStatus}
        </Badge>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'INFO' && (
        <Card className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
            {canEditMemo && (
              <button onClick={handleUpdateMemo} className="text-sm bg-gray-100 px-3 py-1 rounded text-gray-700 hover:bg-gray-200">
                메모 수정
              </button>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="text-gray-500">계정 ID</dt>
              <dd className="font-medium text-gray-900 mt-1">{customer.accountId}</dd>
            </div>
            <div>
              <dt className="text-gray-500">업종</dt>
              <dd className="font-medium text-gray-900 mt-1">{customer.industry}</dd>
            </div>
            <div>
              <dt className="text-gray-500">연락처</dt>
              <dd className="font-medium text-gray-900 mt-1">{customer.contact}</dd>
            </div>
            <div>
              <dt className="text-gray-500">가입일</dt>
              <dd className="font-medium text-gray-900 mt-1">
                {format(new Date(customer.joinedAt), 'yyyy-MM-dd HH:mm')}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 border-t pt-4">체험판 제공 상태</dt>
              <dd className="font-medium text-gray-900 mt-1 flex flex-col gap-1">
                <span>지급 횟수: <strong className="text-indigo-600">{customer.trialCount || 0}회</strong></span>
                {customer.trialCount && customer.trialCount > 0 ? (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block w-max">사용 가능</span>
                ) : (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block w-max">소진됨 / 미지급</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">담당 영업자</dt>
              <dd className="font-medium text-gray-900 mt-1">
                {salesAgent ? (
                  <span className="text-indigo-600 cursor-pointer hover:underline" onClick={() => currentRole === 'ADMIN' && navigate(`/sales/${salesAgent.salesId}`)}>
                    {salesAgent.name} {currentRole !== 'ADMIN' && '(조회 전용)'}
                  </span>
                ) : (
                  '직접 가입 (없음)'
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 border-t pt-4">고객 메모</dt>
              <dd className="font-medium text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                {customer.memo || '작성된 메모가 없습니다.'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 border-t pt-4">커스텀 프롬프트</dt>
              <dd className="font-medium text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                {customer.prompt || '설정된 프롬프트가 없습니다.'}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {activeTab === 'PAYMENT' && (
        <div className="space-y-6">
          {subscription && (
            <Card className="p-6">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900">구독 정보</h3>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <dt className="text-gray-500">상품</dt>
                  <dd className="font-medium text-indigo-700 mt-1">{subscription.product}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">상태</dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    <Badge variant={getSubscriptionBadgeVariant(subscription.status)}>
                      {SubscriptionStatusKR[subscription.status] || subscription.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">시작일</dt>
                  <dd className="font-medium text-gray-900 mt-1">{format(new Date(subscription.startAt), 'yyyy-MM-dd')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">다음 결제예정일</dt>
                  <dd className="font-medium text-gray-900 mt-1">{format(new Date(subscription.nextBillingAt), 'yyyy-MM-dd')}</dd>
                </div>
              </dl>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">결제 내역</h3>
            <div className="space-y-3">
              {payments.length === 0 && <p className="text-sm text-gray-500">결제 내역이 없습니다.</p>}
              {payments.map((p) => (
                <div key={p.paymentId} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{p.amount.toLocaleString()}원</p>
                    <p className="text-gray-500 text-xs mt-1">{format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm')} / {p.method}</p>
                  </div>
                  <Badge variant={getPaymentBadgeVariant(p.status)}>
                    {PaymentStatusKR[p.status] || p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">권한 및 상태 관리</h3>
            <div className="space-y-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">고객 상태 변경 (현재: {customer.serviceStatus})</h4>
                <div className="flex gap-2">
                  {['ACTIVE', 'FREE', 'SUSPENDED', 'TRIAL'].map(st => (
                    <button
                      key={st}
                      disabled={!canEditStatus || customer.serviceStatus === st}
                      onClick={() => handleStatusChange(st)}
                      className={clsx(
                        "px-4 py-2 rounded-md transition",
                        customer.serviceStatus === st ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                {!canEditStatus && <p className="text-xs text-red-500 mt-1">상태 변경 권한이 없습니다.</p>}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">구독 상품 변경 (현재: {subscription?.product || '없음'})</h4>
                <div className="flex flex-col gap-2">
                  {CAIFY_PRODUCTS.map(prod => (
                    <button
                      key={prod}
                      disabled={!canEditProduct || subscription?.product === prod}
                      onClick={() => handleProductChange(prod)}
                      className={clsx(
                        "px-4 py-2 rounded-md transition text-left",
                        subscription?.product === prod ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {prod}
                    </button>
                  ))}
                </div>
                {!canEditProduct && <p className="text-xs text-red-500 mt-1">ADMIN만 상품 변경이 가능합니다.</p>}
              </div>

              <div className="bg-orange-50 p-4 rounded-md border border-orange-100">
                <h4 className="font-medium text-orange-800 mb-2">체험판 관리 (잔여: {customer.trialCount || 0}회)</h4>
                <div className="flex items-center justify-between">
                  <p className="text-orange-700 text-sm">산출물 제공 시 1회를 차감합니다. 0회가 되면 FREE 상태로 전환됩니다.</p>
                  <button
                    disabled={!canConsumeTrial}
                    onClick={handleConsumeTrial}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    1회 차감하기
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">활동 로그</h3>
            <div className="space-y-4">
              {customerLogs.length === 0 && <p className="text-sm text-gray-500">활동 로그가 없습니다.</p>}
              {customerLogs.map(log => (
                <div key={log.id} className="border-l-4 border-gray-300 pl-4 py-1">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{log.actionType}</span>
                    <span className="text-gray-500 font-normal">by</span> {log.actorName} ({log.actorRole})
                  </p>
                  {log.meta && (
                    <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded">
                      {JSON.stringify(log.meta)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">최근 문의 내역</h3>
            <div className="space-y-3">
              {inquiries.length === 0 && <p className="text-sm text-gray-500">문의 내역이 없습니다.</p>}
              {inquiries.map((inq) => (
                <div
                  key={inq.inquiryId}
                  onClick={() => navigate(`/inquiries/${inq.inquiryId}`)}
                  className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 cursor-pointer p-3 rounded-md border border-gray-100 text-sm transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-gray-900 truncate">{inq.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{format(new Date(inq.createdAt), 'yyyy-MM-dd')}</p>
                  </div>
                  <Badge variant={getInquiryBadgeVariant(inq.status)}>
                    {InquiryStatusKR[inq.status] || inq.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};