import { useNavigate, useLocation } from 'react-router-dom';
import { useFormState } from '../context/FormStateContext';

export const useFormNavigation = (moduleType: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  const formState = useFormState();

  const buildQualityInspectionQuery = (
    options: {
      docNo: string;
      sourceId?: string | number;
      partProductName?: string;
      partNo?: string;
      customerName?: string;
      challanNoDate?: string;
      invoiceQty?: string | number;
      reportNo?: string;
    },
    view = false
  ) => {
    const params = new URLSearchParams();
    params.set('docNo', options.docNo || '');
    params.set('sourceType', moduleType);

    if (options.sourceId !== undefined && options.sourceId !== null && String(options.sourceId) !== '') {
      params.set('sourceId', String(options.sourceId));
    }
    if (options.partProductName) params.set('partProductName', options.partProductName);
    if (options.partNo) params.set('partNo', options.partNo);
    if (options.customerName) params.set('customerName', options.customerName);
    if (options.challanNoDate) params.set('challanNoDate', options.challanNoDate);
    if (options.invoiceQty !== undefined && options.invoiceQty !== null && String(options.invoiceQty) !== '') {
      params.set('invoiceQty', String(options.invoiceQty));
    }
    if (options.reportNo) params.set('reportNo', options.reportNo);
    if (view) params.set('view', '1');

    return params;
  };

  const navigateToQualityInspection = (
    formData: any,
    options: {
      docNo: string;
      sourceId?: string | number;
      partProductName?: string;
      partNo?: string;
      customerName?: string;
      challanNoDate?: string;
      invoiceQty?: string | number;
      reportNo?: string;
    },
    id?: string | number
  ) => {
    formState.saveFormState(moduleType, formData, id);
    const params = buildQualityInspectionQuery(options);
    navigate(`/quality-inspection/new?${params.toString()}`);
  };

  const navigateToQualityInspectionView = (
    formData: any,
    options: {
      docNo: string;
      sourceId?: string | number;
      partProductName?: string;
      partNo?: string;
      customerName?: string;
      challanNoDate?: string;
      invoiceQty?: string | number;
      reportNo?: string;
    },
    id?: string | number
  ) => {
    // Preserve the exact source/DC state so the report can display the
    // complete pending inspection without duplicating its table in the DC.
    formState.saveFormState(moduleType, formData, id);
    const params = buildQualityInspectionQuery(options, true);
    navigate(`/quality-inspection/new?${params.toString()}`);
  };

  const returnFromQualityInspection = () => {
    const params = new URLSearchParams(location.search);
    if (params.get('returnFromQI') !== '1') return null;

    const sourceId = params.get('sourceId');
    return formState.restoreFormState(moduleType, sourceId ? sourceId : undefined);
  };

  const goBack = () => {
    const savedState = returnFromQualityInspection();
    if (savedState) {
      navigate(-1);
    } else {
      const path = formState.getModulePath(moduleType);
      navigate(path);
    }
  };

  return {
    navigateToQualityInspection,
    navigateToQualityInspectionView,
    returnFromQualityInspection,
    goBack,
    hasSavedState: formState.hasSavedState(moduleType),
  };
};