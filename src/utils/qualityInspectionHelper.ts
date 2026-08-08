import type { NavigateFunction } from 'react-router-dom';

interface QINavigationOptions {
  docNo: string;
  sourceType: string;
  sourceId?: string | number;
  partProductName?: string;
  partNo?: string;
  customerName?: string;
  challanNoDate?: string;
  invoiceQty?: string | number;
  reportNo?: string;
  extraParams?: Record<string, string>;
}

export const navigateToQualityInspection = (
  navigate: NavigateFunction,
  options: QINavigationOptions
): void => {
  const {
    docNo,
    sourceType,
    sourceId,
    partProductName = '',
    partNo = '',
    customerName = '',
    challanNoDate = '',
    invoiceQty = '',
    reportNo = '',
    extraParams = {}
  } = options;

  const baseUrl = '/quality-inspection/new';
  
  // Build query parameters
  const params = new URLSearchParams();
  params.set('docNo', encodeURIComponent(docNo));
  params.set('sourceType', sourceType);
  if (sourceId) params.set('sourceId', String(sourceId));
  if (partProductName) params.set('partProductName', encodeURIComponent(partProductName));
  if (partNo) params.set('partNo', encodeURIComponent(partNo));
  if (customerName) params.set('customerName', encodeURIComponent(customerName));
  if (challanNoDate) params.set('challanNoDate', encodeURIComponent(challanNoDate));
  if (invoiceQty) params.set('invoiceQty', String(invoiceQty));
  if (reportNo) params.set('reportNo', encodeURIComponent(reportNo));
  
  // Add return flag
  params.set('returnFromQI', '1');
  
  // Add any extra parameters
  Object.entries(extraParams).forEach(([key, value]) => {
    params.set(key, encodeURIComponent(value));
  });

  const url = `${baseUrl}?${params.toString()}`;
  navigate(url);
};

export const getReturnPath = (
  sourceType: string, 
  sourceId?: string | number
): string => {
  const paths: Record<string, string> = {
    'delivery_challan': '/delivery-challan',
    'sales_invoice': '/sales-bill',
    'purchase_order': '/purchase-order',
    'purchase_invoice': '/purchase-invoice',
    'sales_order': '/sales-order',
    'quotation': '/quotation',
    'grn': '/grn',
    'material_request': '/material-request',
    'supplier_quotation': '/supplier-quotation',
    'job_card': '/job-cards',
    'work_order': '/work-order',
    'stock_entry': '/stock-entry',
  };
  
  const basePath = paths[sourceType] || `/${sourceType}`;
  if (sourceId) {
    return `${basePath}/edit/${sourceId}`;
  }
  return basePath;
};