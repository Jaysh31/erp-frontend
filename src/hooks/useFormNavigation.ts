import { useNavigate, useLocation } from 'react-router-dom';
import { useFormState } from '../context/FormStateContext';

export const useFormNavigation = (moduleType: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  const formState = useFormState();

  const navigateToQualityInspection = (
    formData: any,
    options: {
      docNo: string;
      partProductName?: string;
      partNo?: string;
      customerName?: string;
      challanNoDate?: string;
      invoiceQty?: string | number;
      reportNo?: string;
    }
  ) => {
    // Save current form state
    formState.saveFormState(moduleType, formData);

    // Build URL parameters
    const params = new URLSearchParams();
    params.set('docNo', encodeURIComponent(options.docNo));
    params.set('sourceType', moduleType);
    params.set('returnFromQI', '1');
    
    if (options.partProductName) {
      params.set('partProductName', encodeURIComponent(options.partProductName));
    }
    if (options.partNo) {
      params.set('partNo', encodeURIComponent(options.partNo));
    }
    if (options.customerName) {
      params.set('customerName', encodeURIComponent(options.customerName));
    }
    if (options.challanNoDate) {
      params.set('challanNoDate', encodeURIComponent(options.challanNoDate));
    }
    if (options.invoiceQty) {
      params.set('invoiceQty', String(options.invoiceQty));
    }
    if (options.reportNo) {
      params.set('reportNo', encodeURIComponent(options.reportNo));
    }

    navigate(`/quality-inspection/new?${params.toString()}`);
  };

  const returnFromQualityInspection = () => {
    const params = new URLSearchParams(location.search);
    const returnFlag = params.get('returnFromQI');
    
    if (returnFlag === '1') {
      const savedState = formState.restoreFormState(moduleType);
      return savedState;
    }
    return null;
  };

  const goBack = () => {
    const savedState = returnFromQualityInspection();
    if (savedState) {
      // State restored, just navigate back
      navigate(-1);
    } else {
      // Navigate to listing
      const path = formState.getModulePath(moduleType);
      navigate(path);
    }
  };

  return {
    navigateToQualityInspection,
    returnFromQualityInspection,
    goBack,
    hasSavedState: formState.hasSavedState(moduleType)
  };
};