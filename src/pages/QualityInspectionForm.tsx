import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaPlus, FaTrash,
  FaExclamationTriangle, FaClipboardCheck, FaSpinner
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './QualityInspectionForm.css';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ─────────────────────────── Types ─────────────────────────── */

interface MasterData {
  companies: Array<{ id: string | number; name: string }>;
  items: Array<{ id: string | number; name: string; part_no?: string; item_code?: string }>;
  customers: Array<{ id: string | number; name: string }>;
  suppliers: Array<{ id: string | number; name: string }>;
  warehouses: Array<{ id: string | number; name: string }>;
  employees: Array<{ id: string | number; name: string }>;
  qualityTemplates: Array<{ id: string | number; name: string }>;
}

interface QualityTemplateDetail {
  id: string | number;
  name: string;
  parameters: Array<{
    id: string | number;
    parameter_name: string;
    specification: string;
    inspection_method_id: string | number;
    inspection_method_name: string;
  }>;
}

interface ParameterRow {
  id: string;
  parameter_id: string | number;
  parameter_name: string;
  specification: string;
  inspection_method_id: string | number;
  inspection_method_name: string;
  observations: string[];
  result: string;
  remarks: string;
}

interface ObservationDetail {
  sample_no: number;
  observed_value: string;
  result: string;
  remarks: string;
}

interface InspectionDetail {
  parameter_id: string | number;
  inspection_method_id: string | number;
  specification: string;
  result: string;
  remarks: string;
  observations: ObservationDetail[];
}

interface InspectionForm {
  inspection_no: string;
  company_id: string | number;
  inspection_date: string;
  inspection_type: string;
  reference_type: string;
  reference_id: string;
  item_id: string | number;
  quality_template_id: string | number;
  warehouse_id: string | number;
  customer_id: string | number;
  supplier_id: string | number;
  drawing_no: string;
  revision_no: string;
  inspection_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  status: string;
  overall_result: string;
  remarks: string;
  inspected_by: string | number;
  reviewed_by: string | number;
  approved_by: string | number;
  details: InspectionDetail[];
  sampleCount: number;
}

const defaultFormData = (): InspectionForm => ({
  inspection_no: '',
  company_id: '',
  inspection_date: new Date().toISOString().split('T')[0],
  inspection_type: 'INCOMING',
  reference_type: 'PO',
  reference_id: '',
  item_id: '',
  quality_template_id: '',
  warehouse_id: '',
  customer_id: '',
  supplier_id: '',
  drawing_no: '',
  revision_no: '00',
  inspection_qty: 0,
  accepted_qty: 0,
  rejected_qty: 0,
  status: 'DRAFT',
  overall_result: 'PENDING',
  remarks: '',
  inspected_by: '',
  reviewed_by: '',
  approved_by: '',
  details: [],
  sampleCount: 10,
});

/* ─────────────────────────── Helpers ─────────────────────────── */

let rowSeq = 0;
const nextId = () => `p${Date.now().toString(36)}${(rowSeq++).toString(36)}`;

const parseSpecRange = (spec: string): [number, number] | null => {
  if (!spec) return null;
  const cleaned = spec.replace(/\s+/g, '');
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)(?:±|\+-|\+\/-)(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const nominal = parseFloat(match[1]);
  const tolerance = parseFloat(match[2]);
  if (isNaN(nominal) || isNaN(tolerance)) return null;
  return [nominal - tolerance, nominal + tolerance];
};

const isObservationOutOfSpec = (spec: string, value: string): boolean => {
  if (!value.trim()) return false;
  const range = parseSpecRange(spec);
  if (!range) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num < range[0] || num > range[1];
};

const escapeHtml = (value: string): string => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function QualityInspectionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';

  const isEditMode = !!id && id !== 'new';

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [formData, setFormData] = useState<InspectionForm>(defaultFormData());
  const [masterData, setMasterData] = useState<MasterData>({
    companies: [],
    items: [],
    customers: [],
    suppliers: [],
    warehouses: [],
    employees: [],
    qualityTemplates: [],
  });
  const [templateDetails, setTemplateDetails] = useState<QualityTemplateDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [loadingMasterData, setLoadingMasterData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null }>({});
  const setRef = (key: string) => (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => {
    inputRefs.current[key] = el;
  };

  /* ─── Helper to extract data from API response ───────────────── */

  const extractData = (response: any): any[] => {
    if (!response) return [];
    
    console.log('extractData - raw response:', response);
    
    // If response has success field
    if (response.success !== undefined) {
      // If success is 0 or false, return empty array
      if (response.success === 0 || response.success === false) {
        return [];
      }
      
      const data = response.data;
      if (!data) return [];
      
      // If data is an array, return it directly
      if (Array.isArray(data)) {
        console.log('extractData - data is array, length:', data.length);
        return data;
      }
      
      // If data has a data property that is an array (nested like { data: { data: [...] } })
      if (data.data && Array.isArray(data.data)) {
        console.log('extractData - data.data is array, length:', data.data.length);
        return data.data;
      }
      
      // If data has records property (pagination)
      if (data.records && Array.isArray(data.records)) {
        console.log('extractData - data.records is array, length:', data.records.length);
        return data.records;
      }
      
      // If data has other array property
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          console.log('extractData - data.' + key + ' is array, length:', data[key].length);
          return data[key];
        }
      }
      
      // If data is a single object, wrap it in array
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        console.log('extractData - data is single object');
        return [data];
      }
    }
    
    // If response itself is an array
    if (Array.isArray(response)) {
      console.log('extractData - response is array, length:', response.length);
      return response;
    }
    
    // If response has records
    if (response.records && Array.isArray(response.records)) {
      console.log('extractData - response.records is array, length:', response.records.length);
      return response.records;
    }
    
    // If response is a single object with id
    if (response && typeof response === 'object' && response.id !== undefined) {
      console.log('extractData - response is single object');
      return [response];
    }
    
    console.log('extractData - returning empty array');
    return [];
  };

  const extractSingleData = (response: any): any => {
    if (!response) return null;
    
    if (response.success !== undefined) {
      if (response.success === 0 || response.success === false) {
        return null;
      }
      return response.data || null;
    }
    
    return response;
  };

  /* ─── Load Master Data ─────────────────────────────────────── */

  const loadMasterData = async () => {
    setLoadingMasterData(true);
    try {
      // Try to load each API individually to handle 404s gracefully
      const endpoints = [
        { key: 'companies', url: '/company' },
        { key: 'items', url: '/item' },
        { key: 'customers', url: '/customer' },
        { key: 'suppliers', url: '/supplier' },
        { key: 'warehouses', url: '/warehouse' },
        { key: 'employees', url: '/employee' },
        { key: 'qualityTemplates', url: '/quality-template' },
      ];

      const results: any = {};

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint.url);
          const data = extractData(response.data);
          results[endpoint.key] = data;
          console.log(`Loaded ${endpoint.key}:`, data.length, 'items');
        } catch (err: any) {
          console.warn(`Failed to load ${endpoint.key}:`, err.message);
          results[endpoint.key] = [];
        }
      }

      setMasterData({
        companies: results.companies.map((c: any) => ({ 
          id: c.id, 
          name: c.company_name || c.name || c.company || '' 
        })),
        items: results.items.map((i: any) => ({ 
          id: i.id, 
          name: i.item_name || i.name || '', 
          part_no: i.item_code || i.part_no || '' 
        })),
        customers: results.customers.map((c: any) => ({ 
          id: c.id, 
          name: c.customer_name || c.name || '' 
        })),
        suppliers: results.suppliers.map((s: any) => ({ 
          id: s.id, 
          name: s.supplier_name || s.name || '' 
        })),
        warehouses: results.warehouses.map((w: any) => ({ 
          id: w.id, 
          name: w.warehouse_name || w.name || '' 
        })),
        employees: results.employees.map((e: any) => ({ 
          id: e.id, 
          name: e.employee_name || e.name || (e.first_name ? e.first_name + ' ' + (e.last_name || '') : '') || '' 
        })),
        qualityTemplates: results.qualityTemplates.map((t: any) => ({ 
          id: t.id, 
          name: t.template_name || t.name || '' 
        })),
      });

      console.log('Final Master Data:', masterData);
    } catch (err: any) {
      console.error('Error loading master data:', err);
      toast.error('Failed to load some master data');
    } finally {
      setLoadingMasterData(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  /* ─── Load Quality Template Details ────────────────────────── */

  const loadTemplateDetails = async (templateId: string | number) => {
    if (!templateId) {
      setTemplateDetails(null);
      return;
    }

    try {
      const response = await api.get(`/quality-template/${templateId}`);
      const data = extractSingleData(response.data);

      console.log('Template Details:', data);

      if (data && data.parameters && data.parameters.length > 0) {
        setTemplateDetails(data);

        const sampleCount = formData.sampleCount || 10;
        const details: InspectionDetail[] = data.parameters.map((param: any) => ({
          parameter_id: param.id || param.parameter_id,
          inspection_method_id: param.inspection_method_id || '',
          specification: param.specification || '',
          result: '',
          remarks: '',
          observations: Array.from({ length: sampleCount }, (_, i) => ({
            sample_no: i + 1,
            observed_value: '',
            result: '',
            remarks: '',
          })),
        }));

        setFormData(prev => ({
          ...prev,
          quality_template_id: templateId,
          details,
        }));
      } else {
        toast('No parameters found in this template');
      }
    } catch (err: any) {
      console.error('Error loading template details:', err);
      toast.error('Failed to load quality template details');
    }
  };

  /* ─── load existing record when editing ─────────────────────── */

  const fetchInspectionById = async (recordId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const response = await api.get(`/quality-inspection/${recordId}`);
      const record = extractSingleData(response.data);

      console.log('Inspection Record:', record);

      if (record) {
        // Set form data with ids
        setFormData({
          inspection_no: record.inspection_no || '',
          company_id: record.company_id || '',
          inspection_date: record.inspection_date ? record.inspection_date.split('T')[0] : new Date().toISOString().split('T')[0],
          inspection_type: record.inspection_type || 'INCOMING',
          reference_type: record.reference_type || 'PO',
          reference_id: record.reference_id || '',
          item_id: record.item_id || '',
          quality_template_id: record.quality_template_id || '',
          warehouse_id: record.warehouse_id || '',
          customer_id: record.customer_id || '',
          supplier_id: record.supplier_id || '',
          drawing_no: record.drawing_no || '',
          revision_no: record.revision_no || '00',
          inspection_qty: record.inspection_qty || 0,
          accepted_qty: record.accepted_qty || 0,
          rejected_qty: record.rejected_qty || 0,
          status: record.status || 'DRAFT',
          overall_result: record.overall_result || 'PENDING',
          remarks: record.remarks || '',
          inspected_by: record.inspected_by || '',
          reviewed_by: record.reviewed_by || '',
          approved_by: record.approved_by || '',
          details: record.details || [],
          sampleCount: record.details?.[0]?.observations?.length || 10,
        });

        // Load template details if template_id exists
        if (record.quality_template_id) {
          await loadTemplateDetails(record.quality_template_id);
        }
      } else {
        setApiError('Inspection report not found');
      }
    } catch (err: any) {
      console.error('Error fetching inspection report:', err);
      setApiError(err.response?.data?.message || 'Failed to load inspection report');
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      fetchInspectionById(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ─── auto-print when opened from the listing page's Print action ── */

  useEffect(() => {
    if (autoPrint && !loadingRecord) {
      const timer = setTimeout(() => handlePrint(), 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, loadingRecord]);

  /* ─── header field handlers ──────────────────────────────────── */

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    // Load template details when quality_template_id changes
    if (name === 'quality_template_id' && value) {
      loadTemplateDetails(value);
    }
  };

  /* ─── parameter row handlers ─────────────────────────────────── */

  const handleParameterFieldChange = (rowIndex: number, field: 'specification' | 'result' | 'remarks', value: string) => {
    setFormData(prev => {
      const details = [...prev.details];
      details[rowIndex] = { ...details[rowIndex], [field]: value };
      return { ...prev, details };
    });
  };

  const handleObservationChange = (rowIndex: number, colIndex: number, value: string) => {
    setFormData(prev => {
      const details = [...prev.details];
      const observations = [...details[rowIndex].observations];
      observations[colIndex] = { ...observations[colIndex], observed_value: value };
      details[rowIndex] = { ...details[rowIndex], observations };
      return { ...prev, details };
    });
  };

  const addParameterRow = () => {
    setFormData(prev => ({
      ...prev,
      details: [
        ...prev.details,
        {
          parameter_id: '',
          inspection_method_id: '',
          specification: '',
          result: '',
          remarks: '',
          observations: Array.from({ length: prev.sampleCount }, (_, i) => ({
            sample_no: i + 1,
            observed_value: '',
            result: '',
            remarks: '',
          })),
        },
      ],
    }));
  };

  const removeParameterRow = (rowIndex: number) => {
    setFormData(prev => {
      if (prev.details.length <= 1) return prev;
      return { ...prev, details: prev.details.filter((_, i) => i !== rowIndex) };
    });
  };

  const addSampleColumn = () => {
    setFormData(prev => ({
      ...prev,
      sampleCount: prev.sampleCount + 1,
      details: prev.details.map(row => ({
        ...row,
        observations: [
          ...row.observations,
          { sample_no: prev.sampleCount + 1, observed_value: '', result: '', remarks: '' }
        ],
      })),
    }));
  };

  const removeSampleColumn = () => {
    setFormData(prev => {
      if (prev.sampleCount <= 1) return prev;
      return {
        ...prev,
        sampleCount: prev.sampleCount - 1,
        details: prev.details.map(row => ({
          ...row,
          observations: row.observations.slice(0, -1),
        })),
      };
    });
  };

  /* ─── out-of-spec summary ────────────────────────────────────── */

  const outOfSpecCount = formData.details.reduce((count, row) => {
    return count + row.observations.filter(v => isObservationOutOfSpec(row.specification, v.observed_value)).length;
  }, 0);

  /* ─── export / print ─────────────────────────────────────────── */

  const buildPrintHtml = (): string => {
    const sampleHeaderCells = Array.from({ length: formData.sampleCount }, (_, i) => `<th class="obs">${i + 1}</th>`).join('');

    const getParameterName = (paramId: string | number) => {
      if (templateDetails) {
        const param = templateDetails.parameters.find(p => String(p.id) === String(paramId));
        if (param) return param.parameter_name;
      }
      return String(paramId);
    };

    const getInspectionMethodName = (methodId: string | number) => {
      if (templateDetails) {
        const param = templateDetails.parameters.find(p => String(p.inspection_method_id) === String(methodId));
        if (param) return param.inspection_method_name;
      }
      return String(methodId);
    };

    const parameterRows = formData.details.map((row, rowIndex) => {
      const obsCells = row.observations.map((value) => {
        const outOfSpec = isObservationOutOfSpec(row.specification, value.observed_value);
        return `<td class="obs${outOfSpec ? ' out-of-spec' : ''}">${escapeHtml(value.observed_value)}</td>`;
      }).join('');
      return `
        <tr>
          <td class="sr">${rowIndex + 1}</td>
          <td>${escapeHtml(getParameterName(row.parameter_id))}</td>
          <td>${escapeHtml(row.specification)}</td>
          <td>${escapeHtml(getInspectionMethodName(row.inspection_method_id))}</td>
          ${obsCells}
        </tr>`;
    }).join('');

    const companyName = masterData.companies.find(c => String(c.id) === String(formData.company_id))?.name || '';
    const customerName = masterData.customers.find(c => String(c.id) === String(formData.customer_id))?.name || '';
    const itemName = masterData.items.find(i => String(i.id) === String(formData.item_id))?.name || '';
    const itemPartNo = masterData.items.find(i => String(i.id) === String(formData.item_id))?.part_no || '';
    const inspectedByName = masterData.employees.find(e => String(e.id) === String(formData.inspected_by))?.name || '';
    const reviewedByName = masterData.employees.find(e => String(e.id) === String(formData.reviewed_by))?.name || '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(formData.inspection_no || 'Inspection Report')}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 0; }
  .sheet { border: 2px solid #000; padding: 6px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; margin-bottom: 6px; }
  td, th { border: 1px solid #000; padding: 4px 8px; font-size: 11px; vertical-align: middle; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .letterhead td { padding: 8px 10px; }
  .letterhead .company { width: 26%; background: #f0f0f0; font-size: 16px; font-weight: 800; letter-spacing: 0.4px; }
  .letterhead .report-title { width: 48%; text-align: center; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
  .letterhead .docno { width: 26%; white-space: nowrap; font-weight: 600; }
  .meta td { padding: 4px 8px; font-size: 12px; }
  .meta .label { font-weight: 600; background: #f0f0f0; white-space: nowrap; width: 11%; }
  .obs-table th { background: #f0f0f0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2px; text-align: center; }
  .obs-table .sr { width: 40px; text-align: center; }
  .obs-table .obs { width: 62px; text-align: center; }
  .out-of-spec { background: #fbd5d5 !important; color: #b91c1c !important; font-weight: 700; }
  .notes td { font-weight: 600; font-size: 12px; }
  .notes .remarks { font-weight: 400; }
  .signoff td { font-size: 12px; vertical-align: top; }
  .signoff .rev-cell { width: 22%; }
  .signoff .name-cell { width: 39%; }
  .label-inline { font-weight: 600; color: #333; margin-right: 6px; }
</style>
</head>
<body>
  <div class="sheet">
    <table class="letterhead">
      <tr>
        <td class="company">${escapeHtml(companyName)}</td>
        <td class="report-title">FINAL INSPECTION REPORT</td>
        <td class="docno">DOC. NO: ${escapeHtml(formData.inspection_no)}</td>
      </tr>
    </table>

    <table class="meta">
      <tr>
        <td class="label">Part / Product Name :-</td>
        <td colspan="2">${escapeHtml(itemName)}</td>
        <td class="label">Part No :-</td>
        <td colspan="2">${escapeHtml(itemPartNo)}</td>
        <td class="label">Date :</td>
        <td>${escapeHtml(formData.inspection_date)}</td>
      </tr>
      <tr>
        <td class="label">Drawing No :-</td>
        <td colspan="2">${escapeHtml(formData.drawing_no)}</td>
        <td class="label">Rev. No :</td>
        <td colspan="2">${escapeHtml(formData.revision_no)}</td>
        <td class="label">Invoice No :</td>
        <td>${escapeHtml(formData.reference_id)}</td>
      </tr>
      <tr>
        <td class="label">Customer Name :</td>
        <td colspan="2">${escapeHtml(customerName)}</td>
        <td class="label">Challan No / Date :</td>
        <td colspan="2">${escapeHtml('')}</td>
        <td class="label">Invoice Qty :</td>
        <td>${escapeHtml(String(formData.inspection_qty))}</td>
      </tr>
      <tr>
        <td class="label"></td>
        <td colspan="2"></td>
        <td class="label"></td>
        <td colspan="2"></td>
        <td class="label">Report No :</td>
        <td>${escapeHtml(formData.inspection_no)}</td>
      </tr>
    </table>

    <table class="obs-table">
      <thead>
        <tr>
          <th class="sr" rowspan="2">Sr No</th>
          <th rowspan="2">Parameters</th>
          <th rowspan="2">Specification</th>
          <th rowspan="2">Inspection Method</th>
          <th colspan="${formData.sampleCount}">Observation</th>
        </tr>
        <tr>${sampleHeaderCells}</tr>
      </thead>
      <tbody>
        ${parameterRows}
      </tbody>
    </table>

    <table class="notes">
      <tr><td>ALL DIMENSIONS ARE IN MM</td></tr>
      <tr><td>ALL SAMPLES ARE CHECKED RANDOMLY</td></tr>
      <tr><td class="remarks"><span class="label-inline">Supplier Remarks: -</span>${escapeHtml(formData.remarks)}</td></tr>
    </table>

    <table class="signoff">
      <tr>
        <td class="rev-cell">
          <div><span class="label-inline">Rev. No:</span>${escapeHtml(formData.revision_no)}</div>
          <div><span class="label-inline">Rev. Date:</span>${escapeHtml(formData.inspection_date)}</div>
        </td>
        <td class="name-cell"><span class="label-inline">Inspected By:</span>${escapeHtml(inspectedByName)}</td>
        <td class="name-cell"><span class="label-inline">Reviewed By:</span>${escapeHtml(reviewedByName)}</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildPrintHtml();
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const cleanup = () => {
      if (printFrame.parentNode) {
        document.body.removeChild(printFrame);
      }
    };

    printFrame.onload = () => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.error('Print failed:', err);
        toast.error('Could not open the print dialog');
      }
      setTimeout(cleanup, 1000);
    };

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      cleanup();
      toast.error('Could not prepare the print document');
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
  };

  /* ─── validation ─────────────────────────────────────────────── */

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.company_id) newErrors.company_id = 'Company is required';
    if (!formData.item_id) newErrors.item_id = 'Item is required';
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!formData.quality_template_id) newErrors.quality_template_id = 'Quality Template is required';
    if (!formData.inspection_date) newErrors.inspection_date = 'Date is required';
    if (!formData.inspected_by) newErrors.inspected_by = 'Inspected By is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      inputRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputRefs.current[firstKey]?.focus();
      return false;
    }
    return true;
  };

  /* ─── save ───────────────────────────────────────────────────── */

  const buildApiPayload = () => ({
    inspection_no: formData.inspection_no || `QIR-${Date.now().toString(36).toUpperCase()}`,
    company_id: formData.company_id,
    inspection_date: formData.inspection_date,
    inspection_type: formData.inspection_type,
    reference_type: formData.reference_type,
    reference_id: formData.reference_id,
    item_id: formData.item_id,
    quality_template_id: formData.quality_template_id,
    warehouse_id: formData.warehouse_id,
    customer_id: formData.customer_id,
    supplier_id: formData.supplier_id,
    drawing_no: formData.drawing_no,
    revision_no: formData.revision_no,
    inspection_qty: formData.inspection_qty,
    accepted_qty: formData.accepted_qty,
    rejected_qty: formData.rejected_qty,
    status: formData.status,
    overall_result: formData.overall_result,
    remarks: formData.remarks,
    inspected_by: formData.inspected_by,
    reviewed_by: formData.reviewed_by,
    approved_by: formData.approved_by,
    details: formData.details.map(detail => ({
      parameter_id: detail.parameter_id,
      inspection_method_id: detail.inspection_method_id,
      specification: detail.specification,
      result: detail.result,
      remarks: detail.remarks,
      observations: detail.observations.map(obs => ({
        sample_no: obs.sample_no,
        observed_value: obs.observed_value,
        result: obs.result,
        remarks: obs.remarks,
      })),
    })),
  });

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fill in the required fields');
      return;
    }

    setSaving(true);
    setApiError(null);
    try {
      const payload = buildApiPayload();

      let response;
      if (isEditMode && id) {
        response = await api.put('/quality-inspection', payload);
      } else {
        response = await api.post('/quality-inspection', payload);
      }

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to save inspection report');
      }

      toast.success(isEditMode ? 'Inspection report updated!' : 'Inspection report saved!');
      navigate('/quality-inspection');
    } catch (err: any) {
      console.error('Error saving inspection report:', err);
      let message = 'Failed to save inspection report';
      if (err.response) {
        message = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        message = 'Network error. Please check your connection.';
      } else if (err.message) {
        message = err.message;
      }
      setApiError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────── Render ─────────────────────────── */

  return (
    <div className={`qir-page ${theme}-theme`}>
      <div className="qir-header-wrap qir-no-print">
        <div className="qir-header-row">
          <button type="button" className="qir-back-btn" onClick={() => navigate('/quality-inspection')}>
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="qir-title"><FaClipboardCheck size={15} /> {isEditMode ? 'Edit Inspection Report' : 'New Inspection Report'}</h1>

          {apiError && (
            <div className="qir-error-pill">
              <FaExclamationTriangle size={11} /> {apiError}
            </div>
          )}

          {outOfSpecCount > 0 && (
            <div className="qir-error-pill">
              <FaExclamationTriangle size={11} />
              {outOfSpecCount} reading{outOfSpecCount > 1 ? 's' : ''} out of spec
            </div>
          )}

          {(loadingRecord || loadingMasterData) && (
            <div className="qir-error-pill">
              <FaSpinner className="spinning" size={11} /> Loading...
            </div>
          )}

          <div className="qir-header-actions">
            <button type="button" className="qir-btn-secondary" onClick={handlePrint}>
              <FaPrint size={12} /> Print
            </button>
            <button type="button" className="qir-submit-btn" onClick={handleSave} disabled={saving}>
              {saving ? <FaSpinner className="spinning" size={12} /> : <FaSave size={12} />} {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="qir-sheet">

        {/* ── Letterhead ─────────────────────────────────────── */}
        <table className="qir-letterhead">
          <tbody>
            <tr>
              <td className="qir-company-cell">
                <select
                  className="qir-company-input"
                  name="company_id"
                  value={String(formData.company_id)}
                  onChange={handleSelectChange}
                  ref={setRef('company_id')}
                >
                  <option value="">Select Company</option>
                  {masterData.companies.map(company => (
                    <option key={String(company.id)} value={String(company.id)}>{company.name}</option>
                  ))}
                </select>
                {errors.company_id && <span className="qir-error-text qir-no-print">{errors.company_id}</span>}
              </td>
              <td className="qir-report-title-cell">
                <input
                  className="qir-report-title-input"
                  name="reportTitle"
                  value="FINAL INSPECTION REPORT"
                  readOnly
                />
              </td>
              <td className="qir-docno-cell">
                <span className="qir-label-inline">DOC. NO:</span>
                <input
                  className={`qir-inline-input ${errors.inspection_no ? 'qir-input-error' : ''}`}
                  name="inspection_no"
                  value={formData.inspection_no}
                  onChange={handleFieldChange}
                  placeholder="e.g. QIR-2024-001"
                  ref={setRef('inspection_no')}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Meta info grid ────────────────────────────────────── */}
        <table className="qir-meta-table">
          <tbody>
            <tr>
              <td className="qir-meta-label">Part / Product Name :-</td>
              <td className="qir-meta-value" colSpan={2}>
                <select
                  name="item_id"
                  value={String(formData.item_id)}
                  onChange={handleSelectChange}
                  className={errors.item_id ? 'qir-input-error' : ''}
                  ref={setRef('item_id')}
                >
                  <option value="">Select Item</option>
                  {masterData.items.map(item => (
                    <option key={String(item.id)} value={String(item.id)}>{item.name}</option>
                  ))}
                </select>
              </td>
              <td className="qir-meta-label">Part No :-</td>
              <td className="qir-meta-value" colSpan={2}>
                <input
                  name="partNo"
                  value={masterData.items.find(i => String(i.id) === String(formData.item_id))?.part_no || ''}
                  readOnly
                  placeholder="Part number"
                />
              </td>
              <td className="qir-meta-label">Date :</td>
              <td className="qir-meta-value">
                <input type="date" name="inspection_date" value={formData.inspection_date} onChange={handleFieldChange} className={errors.inspection_date ? 'qir-input-error' : ''} ref={setRef('inspection_date')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label">Drawing No :-</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="drawing_no" value={formData.drawing_no} onChange={handleFieldChange} placeholder="Drawing number" ref={setRef('drawing_no')} />
              </td>
              <td className="qir-meta-label">Rev. No :</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="revision_no" value={formData.revision_no} onChange={handleFieldChange} ref={setRef('revision_no')} />
              </td>
              <td className="qir-meta-label">Invoice No :</td>
              <td className="qir-meta-value">
                <input name="reference_id" value={formData.reference_id} onChange={handleFieldChange} ref={setRef('reference_id')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label">Customer Name :</td>
              <td className="qir-meta-value" colSpan={2}>
                <select
                  name="customer_id"
                  value={String(formData.customer_id)}
                  onChange={handleSelectChange}
                  className={errors.customer_id ? 'qir-input-error' : ''}
                  ref={setRef('customer_id')}
                >
                  <option value="">Select Customer</option>
                  {masterData.customers.map(customer => (
                    <option key={String(customer.id)} value={String(customer.id)}>{customer.name}</option>
                  ))}
                </select>
              </td>
              <td className="qir-meta-label">Challan No / Date :</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="challanNoDate" value="" onChange={handleFieldChange} ref={setRef('challanNoDate')} />
              </td>
              <td className="qir-meta-label">Invoice Qty :</td>
              <td className="qir-meta-value">
                <input name="inspection_qty" type="number" value={formData.inspection_qty} onChange={handleFieldChange} placeholder="Nos" ref={setRef('inspection_qty')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label">Supplier :</td>
              <td className="qir-meta-value" colSpan={2}>
                <select
                  name="supplier_id"
                  value={String(formData.supplier_id)}
                  onChange={handleSelectChange}
                  ref={setRef('supplier_id')}
                >
                  <option value="">Select Supplier</option>
                  {masterData.suppliers.map(supplier => (
                    <option key={String(supplier.id)} value={String(supplier.id)}>{supplier.name}</option>
                  ))}
                </select>
              </td>
              <td className="qir-meta-label">Warehouse :</td>
              <td className="qir-meta-value" colSpan={2}>
                <select
                  name="warehouse_id"
                  value={String(formData.warehouse_id)}
                  onChange={handleSelectChange}
                  ref={setRef('warehouse_id')}
                >
                  <option value="">Select Warehouse</option>
                  {masterData.warehouses.map(warehouse => (
                    <option key={String(warehouse.id)} value={String(warehouse.id)}>{warehouse.name}</option>
                  ))}
                </select>
              </td>
              <td className="qir-meta-label">Report No :</td>
              <td className="qir-meta-value">
                <input name="inspection_no" value={formData.inspection_no} onChange={handleFieldChange} className={errors.inspection_no ? 'qir-input-error' : ''} ref={setRef('inspection_no')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label">Quality Template :</td>
              <td className="qir-meta-value" colSpan={7}>
                <select
                  name="quality_template_id"
                  value={String(formData.quality_template_id)}
                  onChange={handleSelectChange}
                  className={errors.quality_template_id ? 'qir-input-error' : ''}
                  ref={setRef('quality_template_id')}
                >
                  <option value="">Select Quality Template</option>
                  {masterData.qualityTemplates.map(template => (
                    <option key={String(template.id)} value={String(template.id)}>{template.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Observation table ───────────────────────────────── */}
        <div className="qir-table-toolbar qir-no-print">
          <span className="qir-toolbar-label">Observation</span>
          <div className="qir-toolbar-actions">
            <button type="button" className="qir-add-btn" onClick={addSampleColumn}>
              <FaPlus size={10} /> Sample Column
            </button>
            <button type="button" className="qir-add-btn" onClick={removeSampleColumn} disabled={formData.sampleCount <= 1}>
              <FaTrash size={10} /> Remove Column
            </button>
            <button type="button" className="qir-add-btn" onClick={addParameterRow}>
              <FaPlus size={10} /> Parameter Row
            </button>
          </div>
        </div>

        <div className="qir-obs-table-wrapper">
          <table className="qir-obs-table">
            <thead>
              <tr>
                <th className="qir-col-sr" rowSpan={2}>Sr No</th>
                <th className="qir-col-param" rowSpan={2}>Parameters</th>
                <th className="qir-col-spec" rowSpan={2}>Specification</th>
                <th className="qir-col-method" rowSpan={2}>Inspection Method</th>
                <th colSpan={formData.sampleCount}>Observation</th>
                <th className="qir-col-del qir-no-print" rowSpan={2}></th>
              </tr>
              <tr>
                {Array.from({ length: formData.sampleCount }, (_, i) => (
                  <th key={i} className="qir-col-obs">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.details.map((row, rowIndex) => {
                const paramName = templateDetails?.parameters?.find(p => String(p.id) === String(row.parameter_id))?.parameter_name || '';
                const methodName = templateDetails?.parameters?.find(p => String(p.inspection_method_id) === String(row.inspection_method_id))?.inspection_method_name || '';
                return (
                  <tr key={nextId()}>
                    <td className="qir-col-sr qir-text-center">{rowIndex + 1}</td>
                    <td className="qir-col-param">
                      <input
                        value={paramName}
                        readOnly
                        placeholder="Parameter"
                      />
                    </td>
                    <td className="qir-col-spec">
                      <input
                        value={row.specification}
                        onChange={(e) => handleParameterFieldChange(rowIndex, 'specification', e.target.value)}
                        placeholder="e.g. 9±0.2"
                      />
                    </td>
                    <td className="qir-col-method">
                      <input
                        value={methodName}
                        readOnly
                        placeholder="Vernier Caliper"
                      />
                    </td>
                    {row.observations.map((value, colIndex) => {
                      const outOfSpec = isObservationOutOfSpec(row.specification, value.observed_value);
                      return (
                        <td key={colIndex} className="qir-col-obs">
                          <input
                            value={value.observed_value}
                            onChange={(e) => handleObservationChange(rowIndex, colIndex, e.target.value)}
                            className={outOfSpec ? 'qir-out-of-spec' : ''}
                            title={outOfSpec ? 'Reading is outside the specification tolerance' : undefined}
                          />
                        </td>
                      );
                    })}
                    <td className="qir-col-del qir-no-print">
                      {formData.details.length > 1 && (
                        <button type="button" className="qir-remove-btn" onClick={() => removeParameterRow(rowIndex)} title="Delete row">
                          <FaTrash size={10} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Notes ────────────────────────────────────────────── */}
        <table className="qir-notes-table">
          <tbody>
            <tr>
              <td>
                <input name="allDimensionsNote" value="ALL DIMENSIONS ARE IN MM" readOnly />
              </td>
            </tr>
            <tr>
              <td>
                <input name="samplesNote" value="ALL SAMPLES ARE CHECKED RANDOMLY" readOnly />
              </td>
            </tr>
            <tr>
              <td className="qir-remarks-row">
                <span className="qir-label-inline">Supplier Remarks: -</span>
                <input name="remarks" value={formData.remarks} onChange={handleFieldChange} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Sign-off footer ──────────────────────────────────── */}
        <table className="qir-signoff-table">
          <tbody>
            <tr>
              <td className="qir-signoff-rev">
                <div><span className="qir-label-inline">Rev. No:</span>
                  <input name="revision_no" value={formData.revision_no} onChange={handleFieldChange} />
                </div>
                <div><span className="qir-label-inline">Rev. Date:</span>
                  <input type="date" name="inspection_date" value={formData.inspection_date} onChange={handleFieldChange} />
                </div>
              </td>
              <td className="qir-signoff-name">
                <span className="qir-label-inline">Inspected By:</span>
                <select
                  name="inspected_by"
                  value={String(formData.inspected_by)}
                  onChange={handleSelectChange}
                  className={errors.inspected_by ? 'qir-input-error' : ''}
                  ref={setRef('inspected_by')}
                >
                  <option value="">Select Employee</option>
                  {masterData.employees.map(employee => (
                    <option key={String(employee.id)} value={String(employee.id)}>{employee.name}</option>
                  ))}
                </select>
              </td>
              <td className="qir-signoff-name">
                <span className="qir-label-inline">Reviewed By:</span>
                <select
                  name="reviewed_by"
                  value={String(formData.reviewed_by)}
                  onChange={handleSelectChange}
                  ref={setRef('reviewed_by')}
                >
                  <option value="">Select Employee</option>
                  {masterData.employees.map(employee => (
                    <option key={String(employee.id)} value={String(employee.id)}>{employee.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}