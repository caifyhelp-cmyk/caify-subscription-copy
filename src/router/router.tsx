import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { Customers } from '../pages/Customers';
import { Inquiries } from '../pages/Inquiries';
import { Sales } from '../pages/Sales';
import { Analytics } from '../pages/Analytics';
import { AuditLogs } from '../pages/AuditLogs';
import { CustomerDetail } from '../pages/CustomerDetail';
import { InquiryDetail } from '../pages/InquiryDetail';
import { SalesDetail } from '../pages/SalesDetail';
import { Subscriptions } from '../pages/Subscriptions';
import { Payments } from '../pages/Payments';
import { SalesLeads } from '../pages/SalesLeads';
import { SalesLeadForm } from '../pages/SalesLeadForm';
import { SalesLeadDetail } from '../pages/SalesLeadDetail';
import { Settlements } from '../pages/Settlements';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:customerId', element: <CustomerDetail /> },
      { path: 'subscriptions', element: <Subscriptions /> },
      { path: 'payments', element: <Payments /> },
      {
        path: 'settlements',
        element: (
          <ProtectedRoute allowedRoles={['SALES']}>
            <Settlements />
          </ProtectedRoute>
        )
      },
      {
        path: 'inquiries',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <Inquiries />
          </ProtectedRoute>
        )
      },
      {
        path: 'inquiries/:inquiryId',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <InquiryDetail />
          </ProtectedRoute>
        )
      },
      {
        path: 'sales',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Sales />
          </ProtectedRoute>
        )
      },
      {
        path: 'sales/:salesId',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SalesDetail />
          </ProtectedRoute>
        )
      },
      {
        path: 'sales-leads',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SalesLeads />
          </ProtectedRoute>
        )
      },
      {
        path: 'sales-leads/new',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SalesLeadForm />
          </ProtectedRoute>
        )
      },
      {
        path: 'sales-leads/:leadId',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SalesLeadDetail />
          </ProtectedRoute>
        )
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <Analytics />
          </ProtectedRoute>
        )
      },
      {
        path: 'audit',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AuditLogs />
          </ProtectedRoute>
        )
      },
    ],
  },
]);