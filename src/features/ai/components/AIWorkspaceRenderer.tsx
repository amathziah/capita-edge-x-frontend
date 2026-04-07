import { AIComplianceWorkspaceCard } from './workspaces/AIComplianceWorkspaceCard';
import { AIExpenseWorkspaceCard } from './workspaces/AIExpenseWorkspaceCard';
import { AIInvoiceWorkspaceCard } from './workspaces/AIInvoiceWorkspaceCard';
import { AIPaymentWorkspaceCard } from './workspaces/AIPaymentWorkspaceCard';
import { AICustomerWorkspaceCard } from './workspaces/AICustomerWorkspaceCard';

export function AIWorkspaceRenderer({
  component,
  data,
  onSelectView,
  onAction,
  isLoadingView,
}: {
  component: string;
  data: any;
  onSelectView?: (viewId: string) => void;
  onAction?: (action: any) => void;
  isLoadingView?: boolean;
}) {
  if (component === 'ai_domain_invoices') {
    return <AIInvoiceWorkspaceCard data={data} onSelectView={onSelectView} onAction={onAction} isLoadingView={isLoadingView} />;
  }

  if (component === 'ai_domain_payments') {
    return <AIPaymentWorkspaceCard data={data} onSelectView={onSelectView} onAction={onAction} isLoadingView={isLoadingView} />;
  }

  if (component === 'ai_domain_expenses') {
    return <AIExpenseWorkspaceCard data={data} onSelectView={onSelectView} onAction={onAction} isLoadingView={isLoadingView} />;
  }

  if (component === 'ai_domain_compliance') {
    return <AIComplianceWorkspaceCard data={data} onSelectView={onSelectView} onAction={onAction} isLoadingView={isLoadingView} />;
  }

  if (component === 'ai_domain_customers') {
    return <AICustomerWorkspaceCard data={data} onSelectView={onSelectView} onAction={onAction} isLoadingView={isLoadingView} />;
  }

  return null;
}
