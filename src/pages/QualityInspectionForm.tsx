import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaPlus, FaTrash,
  FaExclamationTriangle, FaClipboardCheck, FaSpinner, FaSearch
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './QualityInspectionForm.css';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ─────────────────────────── Types ─────────────────────────── */

interface ParameterRow {
  id: string;
  parameter: string;
  specification: string;
  inspectionMethod: string;
  observations: string[];
}

interface InspectionForm {
  companyName: string;
  reportTitle: string;
  docNo: string;
  partProductName: string;
  partNo: string;
  drawingNo: string;
  revNo: string;
  customerName: string;
  date: string;
  invoiceNo: string;
  invoiceQty: string;
  challanNoDate: string;
  reportNo: string;
  parameters: ParameterRow[];
  sampleCount: number;
  allDimensionsNote: string;
  samplesNote: string;
  supplierRemarks: string;
  footerRevNo: string;
  footerRevDate: string;
  inspectedBy: string;
  reviewedBy: string;
}

interface ItemSuggestion {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  description: string;
}

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

const buildDefaultParameters = (sampleCount: number): ParameterRow[] => {
  const blanks = () => Array.from({ length: sampleCount }, () => '');
  return [
    { id: nextId(), parameter: 'Total Length', specification: '9±0.2', inspectionMethod: 'Vernier Caliper', observations: blanks() },
    { id: nextId(), parameter: 'O.D.', specification: '13±0.2', inspectionMethod: 'Vernier Caliper', observations: blanks() },
    { id: nextId(), parameter: 'HOLE', specification: '6.5±0.1', inspectionMethod: 'Vernier Caliper', observations: blanks() },
    { id: nextId(), parameter: 'STEP OD', specification: '10±0.2', inspectionMethod: 'Vernier Caliper', observations: blanks() },
    { id: nextId(), parameter: 'LENGTH', specification: '6±0.1', inspectionMethod: 'Vernier Caliper', observations: blanks() },
  ];
};

const DEFAULT_SAMPLE_COUNT = 10;

const defaultFormData = (): InspectionForm => ({
  companyName: 'CHANDRATARA INDUSTRIES',
  reportTitle: 'FINAL INSPECTION REPORT',
  docNo: '',
  partProductName: '',
  partNo: '',
  drawingNo: '',
  revNo: '00',
  customerName: '',
  date: new Date().toISOString().split('T')[0],
  invoiceNo: '',
  invoiceQty: '',
  challanNoDate: '',
  reportNo: '',
  parameters: buildDefaultParameters(DEFAULT_SAMPLE_COUNT),
  sampleCount: DEFAULT_SAMPLE_COUNT,
  allDimensionsNote: 'ALL DIMENSIONS ARE IN MM',
  samplesNote: 'ALL SAMPLES ARE CHECKED RANDOMLY',
  supplierRemarks: 'Visually Accepted',
  footerRevNo: '00',
  footerRevDate: '',
  inspectedBy: '',
  reviewedBy: '',
});

const unwrapDate = (value?: string | null): string => {
  if (!value) return '';
  return value.split('T')[0];
};

/* ─────────────────── Autocomplete Component ─────────────────── */

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: ItemSuggestion) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search items...',
  className = '',
  error = false,
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/item', {
        params: {
          page: 1,
          limit: 10,
          search: searchTerm.trim()
        }
      });

      if (response.data.success === 1) {
        const items = Array.isArray(response.data.data) ? response.data.data : [];
        setSuggestions(items);
        setIsOpen(items.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error fetching item suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce API calls
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (item: ItemSuggestion) => {
    onSelect(item);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim()) {
              fetchSuggestions(value);
            }
          }}
          placeholder={placeholder}
          className={`${className} ${error ? 'qir-input-error' : ''}`}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <div style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaSpinner className="spinning" size={14} />
          </div>
        )}
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          marginTop: '2px',
          padding: 0,
          listStyle: 'none',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleSuggestionClick(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: index === highlightedIndex ? '#f3f4f6' : 'white',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ fontWeight: 500 }}>{item.item_name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Code: {item.item_code} | Group: {item.item_group}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
  const [recordName, setRecordName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});
  const setRef = (key: string) => (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    inputRefs.current[key] = el;
  };

  /* ─── load existing record when editing ─────────────────────── */

  const loadRecordIntoForm = (record: any) => {
    setRecordName(record.inspection_no ?? null);
    const sampleCount = record.details?.[0]?.observations?.length || DEFAULT_SAMPLE_COUNT;
    
    const parameters: ParameterRow[] = Array.isArray(record.details) && record.details.length > 0
      ? record.details.map((d: any) => ({
          id: nextId(),
          parameter: d.parameter_name || `Parameter ${d.parameter_id}`,
          specification: d.specification || '',
          inspectionMethod: d.inspection_method_name || '',
          observations: Array.isArray(d.observations) && d.observations.length > 0
            ? d.observations.map((obs: any) => obs.observed_value || '')
            : Array.from({ length: sampleCount }, () => ''),
        }))
      : buildDefaultParameters(sampleCount);

    setFormData((prev) => ({
      ...prev,
      companyName: record.company_name || prev.companyName,
      reportTitle: record.report_title || prev.reportTitle,
      docNo: record.doc_no ?? prev.docNo,
      partProductName: record.part_product_name || prev.partProductName,
      partNo: record.part_no || prev.partNo,
      drawingNo: record.drawing_no || prev.drawingNo,
      revNo: record.revision_no || prev.revNo,
      customerName: record.customer_name || prev.customerName,
      date: unwrapDate(record.inspection_date) || prev.date,
      invoiceNo: record.invoice_no || prev.invoiceNo,
      invoiceQty: record.invoice_qty || prev.invoiceQty,
      challanNoDate: record.challan_no_date || prev.challanNoDate,
      reportNo: record.report_no || prev.reportNo,
      parameters,
      sampleCount,
      allDimensionsNote: record.all_dimensions_note || prev.allDimensionsNote,
      samplesNote: record.samples_note || prev.samplesNote,
      supplierRemarks: record.supplier_remarks || prev.supplierRemarks,
      footerRevNo: record.footer_rev_no || prev.footerRevNo,
      footerRevDate: unwrapDate(record.footer_rev_date) || prev.footerRevDate,
      inspectedBy: record.inspected_by || prev.inspectedBy,
      reviewedBy: record.reviewed_by || prev.reviewedBy,
    }));
  };

  const fetchInspectionById = async (recordId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const response = await api.get(`/quality-inspection/${recordId}`);
      if (response.data.success === 1 && response.data.data) {
        loadRecordIntoForm(response.data.data);
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

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  /* ─── Part/Product Name handlers ────────────────────────────── */

  const handlePartProductNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, partProductName: value }));
    if (errors.partProductName) setErrors(prev => ({ ...prev, partProductName: '' }));
  };

  const handlePartProductSelect = (item: ItemSuggestion) => {
    setFormData(prev => ({
      ...prev,
      partProductName: item.item_name,
      partNo: item.item_code // Auto-fill part number with item code
    }));
    if (errors.partProductName) setErrors(prev => ({ ...prev, partProductName: '' }));
  };

  /* ─── parameter row handlers ─────────────────────────────────── */

  const handleParameterFieldChange = (rowIndex: number, field: 'parameter' | 'specification' | 'inspectionMethod', value: string) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      parameters[rowIndex] = { ...parameters[rowIndex], [field]: value };
      return { ...prev, parameters };
    });
  };

  const handleObservationChange = (rowIndex: number, colIndex: number, value: string) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      const observations = [...parameters[rowIndex].observations];
      observations[colIndex] = value;
      parameters[rowIndex] = { ...parameters[rowIndex], observations };
      return { ...prev, parameters };
    });
  };

  const addParameterRow = () => {
    setFormData(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { id: nextId(), parameter: '', specification: '', inspectionMethod: '', observations: Array.from({ length: prev.sampleCount }, () => '') },
      ],
    }));
  };

  const removeParameterRow = (rowIndex: number) => {
    setFormData(prev => {
      if (prev.parameters.length <= 1) return prev;
      return { ...prev, parameters: prev.parameters.filter((_, i) => i !== rowIndex) };
    });
  };

  const addSampleColumn = () => {
    setFormData(prev => ({
      ...prev,
      sampleCount: prev.sampleCount + 1,
      parameters: prev.parameters.map(row => ({ ...row, observations: [...row.observations, ''] })),
    }));
  };

  const removeSampleColumn = () => {
    setFormData(prev => {
      if (prev.sampleCount <= 1) return prev;
      return {
        ...prev,
        sampleCount: prev.sampleCount - 1,
        parameters: prev.parameters.map(row => ({ ...row, observations: row.observations.slice(0, -1) })),
      };
    });
  };

  /* ─── out-of-spec summary ────────────────────────────────────── */

  const outOfSpecCount = formData.parameters.reduce((count, row) => {
    return count + row.observations.filter(v => isObservationOutOfSpec(row.specification, v)).length;
  }, 0);

  /* ─── export / print ─────────────────────────────────────────── */

  const buildPrintHtml = (): string => {
    const sampleHeaderCells = Array.from({ length: formData.sampleCount }, (_, i) => `<th class="obs">${i + 1}</th>`).join('');

    const parameterRows = formData.parameters.map((row, rowIndex) => {
      const obsCells = row.observations.map((value) => {
        const outOfSpec = isObservationOutOfSpec(row.specification, value);
        return `<td class="obs${outOfSpec ? ' out-of-spec' : ''}">${escapeHtml(value)}</td>`;
      }).join('');
      return `
        <tr>
          <td class="sr">${rowIndex + 1}</td>
          <td>${escapeHtml(row.parameter)}</td>
          <td>${escapeHtml(row.specification)}</td>
          <td>${escapeHtml(row.inspectionMethod)}</td>
          ${obsCells}
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(formData.reportNo || 'Inspection Report')}</title>
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
        <td class="company">${escapeHtml(formData.companyName)}</td>
        <td class="report-title">${escapeHtml(formData.reportTitle)}</td>
        <td class="docno">DOC. NO: ${escapeHtml(formData.docNo)}</td>
      </tr>
    </table>

    <table class="meta">
      <tr>
        <td class="label">Part / Product Name :-</td>
        <td colspan="2">${escapeHtml(formData.partProductName)}</td>
        <td class="label">Part No :-</td>
        <td colspan="2">${escapeHtml(formData.partNo)}</td>
        <td class="label">Date :</td>
        <td>${escapeHtml(formData.date)}</td>
      </tr>
      <tr>
        <td class="label">Drawing No :-</td>
        <td colspan="2">${escapeHtml(formData.drawingNo)}</td>
        <td class="label">Rev. No :</td>
        <td colspan="2">${escapeHtml(formData.revNo)}</td>
        <td class="label">Invoice No :</td>
        <td>${escapeHtml(formData.invoiceNo)}</td>
      </tr>
      <tr>
        <td class="label">Customer Name :</td>
        <td colspan="2">${escapeHtml(formData.customerName)}</td>
        <td class="label">Challan No / Date :</td>
        <td colspan="2">${escapeHtml(formData.challanNoDate)}</td>
        <td class="label">Invoice Qty :</td>
        <td>${escapeHtml(formData.invoiceQty)}</td>
      </tr>
      <tr>
        <td class="label"></td>
        <td colspan="2"></td>
        <td class="label"></td>
        <td colspan="2"></td>
        <td class="label">Report No :</td>
        <td>${escapeHtml(formData.reportNo)}</td>
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
      <tr><td>${escapeHtml(formData.allDimensionsNote)}</td></tr>
      <tr><td>${escapeHtml(formData.samplesNote)}</td></tr>
      <tr><td class="remarks"><span class="label-inline">Supplier Remarks: -</span>${escapeHtml(formData.supplierRemarks)}</td></tr>
    </table>

    <table class="signoff">
      <tr>
        <td class="rev-cell">
          <div><span class="label-inline">Rev. No:</span>${escapeHtml(formData.footerRevNo)}</div>
          <div><span class="label-inline">Rev. Date:</span>${escapeHtml(formData.footerRevDate)}</div>
        </td>
        <td class="name-cell"><span class="label-inline">Inspected By:</span>${escapeHtml(formData.inspectedBy)}</td>
        <td class="name-cell"><span class="label-inline">Reviewed By:</span>${escapeHtml(formData.reviewedBy)}</td>
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
    if (!formData.docNo.trim()) newErrors.docNo = 'Doc No is required';
    if (!formData.reportNo.trim()) newErrors.reportNo = 'Report No is required';
    if (!formData.partProductName.trim()) newErrors.partProductName = 'Part / Product Name is required';
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer Name is required';
    if (!formData.date) newErrors.date = 'Date is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      inputRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputRefs.current[firstKey]?.focus();
      return false;
    }
    return true;
  };

  /* ─── Build API payload matching backend expectations ─────────── */

  const buildApiPayload = () => {
    // Generate inspection number if not exists
    const inspectionNo = isEditMode && recordName ? recordName : `QIR-${Date.now().toString(36).toUpperCase()}`;
    
    // Determine overall result
    const overallResult = outOfSpecCount > 0 ? 'Fail' : 'Pass';
    
    // Build details array
    const details = formData.parameters.map((param, index) => {
      // Calculate result for this parameter
      const paramOutOfSpec = param.observations.some(v => isObservationOutOfSpec(param.specification, v));
      const paramResult = paramOutOfSpec ? 'Fail' : 'Pass';
      
      // Build observations array
      const observations = param.observations.map((value, obsIndex) => ({
        sample_no: obsIndex + 1,
        observed_value: value || null,
        result: value && isObservationOutOfSpec(param.specification, value) ? 'Fail' : 'Pass',
        remarks: null
      }));

      return {
        parameter_id: index + 1,
        inspection_method_id: 1,
        specification: param.specification || null,
        result: paramResult,
        remarks: null,
        observations: observations
      };
    });

    // ENUM mapping for inspection_type
    const inspectionTypeMap: { [key: string]: string } = {
      'Incoming Inspection': 'Incoming',
      'In Process Inspection': 'In Process',
      'Final Inspection': 'Final',
      'Dispatch Inspection': 'Dispatch'
    };

    // Get the mapped value or default to 'Final'
    const inspectionType = inspectionTypeMap['Final Inspection'] || 'Final';

    // Determine status based on the inspection state
    // Since this is a completed inspection, we'll use 'Accepted' 
    // which is one of the allowed ENUM values
    const status = outOfSpecCount > 0 ? 'Rejected' : 'Accepted';

    return {
      inspection_no: inspectionNo,
      company_id: 1,
      inspection_date: formData.date || null,
      inspection_type: inspectionType, // Now sends 'Final' instead of 'Final Inspection'
      reference_type: 'Purchase Order', // Changed from 'PO' to match ENUM
      reference_id: 0,
      item_id: 22,
      quality_template_id: null,
      warehouse_id: null,
      batch_id: null,
      customer_id: 0,
      supplier_id: 0,
      drawing_no: formData.drawingNo || null,
      revision_no: formData.revNo || null,
      inspection_qty: parseInt(formData.invoiceQty) || 0,
      accepted_qty: outOfSpecCount > 0 ? 0 : (parseInt(formData.invoiceQty) || 0),
      rejected_qty: outOfSpecCount || 0,
      status: status, // Now sends 'Accepted' or 'Rejected' instead of 'Completed'
      overall_result: overallResult,
      remarks: formData.supplierRemarks || null,
      inspected_by: formData.inspectedBy || null,
      reviewed_by: formData.reviewedBy || null,
      approved_by: null,
      // Additional fields for your specific UI
      doc_no: formData.docNo,
      company_name: formData.companyName,
      report_title: formData.reportTitle,
      part_product_name: formData.partProductName,
      part_no: formData.partNo,
      customer_name: formData.customerName,
      invoice_no: formData.invoiceNo,
      invoice_qty: formData.invoiceQty,
      challan_no_date: formData.challanNoDate,
      report_no: formData.reportNo,
      all_dimensions_note: formData.allDimensionsNote,
      samples_note: formData.samplesNote,
      footer_rev_no: formData.footerRevNo,
      footer_rev_date: formData.footerRevDate,
      details: details
    };
  };

  /* ─── Save ───────────────────────────────────────────────────── */

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
      if (isEditMode && recordName) {
        response = await api.put(`/quality-inspection`, { ...payload, id: parseInt(id!) });
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

          {loadingRecord && (
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
                <input
                  className="qir-company-input"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFieldChange}
                  ref={setRef('companyName')}
                />
              </td>
              <td className="qir-report-title-cell">
                <input
                  className="qir-report-title-input"
                  name="reportTitle"
                  value={formData.reportTitle}
                  onChange={handleFieldChange}
                  ref={setRef('reportTitle')}
                />
              </td>
              <td className="qir-docno-cell">
                <span className="qir-label-inline">DOC. NO:</span>
                <input
                  className={`qir-inline-input ${errors.docNo ? 'qir-input-error' : ''}`}
                  name="docNo"
                  value={formData.docNo}
                  onChange={handleFieldChange}
                  placeholder="e.g. AI / QA / 04"
                  ref={setRef('docNo')}
                />
              </td>
            </tr>
          </tbody>
        </table>
        {errors.docNo && <span className="qir-error-text qir-no-print">{errors.docNo}</span>}

        {/* ── Meta info grid ────────────────────────────────────── */}
        <table className="qir-meta-table">
          <tbody>
            <tr>
              <td className="qir-meta-label">Part / Product Name :-</td>
              <td className="qir-meta-value" colSpan={2}>
                <AutocompleteInput
                  value={formData.partProductName}
                  onChange={handlePartProductNameChange}
                  onSelect={handlePartProductSelect}
                  placeholder="Search and select item..."
                  className={errors.partProductName ? 'qir-input-error' : ''}
                />
              </td>
              <td className="qir-meta-label">Part No :-</td>
              <td className="qir-meta-value" colSpan={2}>
                <input 
                  name="partNo" 
                  value={formData.partNo} 
                  onChange={handleFieldChange} 
                  placeholder="Part number" 
                  ref={setRef('partNo')}
                  readOnly
                  style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                />
              </td>
              <td className="qir-meta-label">Date :</td>
              <td className="qir-meta-value">
                <input type="date" name="date" value={formData.date} onChange={handleFieldChange} className={errors.date ? 'qir-input-error' : ''} ref={setRef('date')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label">Drawing No :-</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="drawingNo" value={formData.drawingNo} onChange={handleFieldChange} placeholder="Drawing number" ref={setRef('drawingNo')} />
              </td>
              <td className="qir-meta-label">Rev. No :</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="revNo" value={formData.revNo} onChange={handleFieldChange} ref={setRef('revNo')} />
              </td>
              <td className="qir-meta-label">Invoice No :</td>
              <td className="qir-meta-value">
                <input name="invoiceNo" value={formData.invoiceNo} onChange={handleFieldChange} ref={setRef('invoiceNo')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label">Customer Name :</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="customerName" value={formData.customerName} onChange={handleFieldChange} placeholder="Customer name" className={errors.customerName ? 'qir-input-error' : ''} ref={setRef('customerName')} />
              </td>
              <td className="qir-meta-label">Challan No / Date :</td>
              <td className="qir-meta-value" colSpan={2}>
                <input name="challanNoDate" value={formData.challanNoDate} onChange={handleFieldChange} ref={setRef('challanNoDate')} />
              </td>
              <td className="qir-meta-label">Invoice Qty :</td>
              <td className="qir-meta-value">
                <input name="invoiceQty" value={formData.invoiceQty} onChange={handleFieldChange} placeholder="Nos" ref={setRef('invoiceQty')} />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label"></td>
              <td className="qir-meta-value" colSpan={2}></td>
              <td className="qir-meta-label"></td>
              <td className="qir-meta-value" colSpan={2}></td>
              <td className="qir-meta-label">Report No :</td>
              <td className="qir-meta-value">
                <input name="reportNo" value={formData.reportNo} onChange={handleFieldChange} className={errors.reportNo ? 'qir-input-error' : ''} ref={setRef('reportNo')} />
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
              {formData.parameters.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="qir-col-sr qir-text-center">{rowIndex + 1}</td>
                  <td className="qir-col-param">
                    <input
                      value={row.parameter}
                      onChange={(e) => handleParameterFieldChange(rowIndex, 'parameter', e.target.value)}
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
                      value={row.inspectionMethod}
                      onChange={(e) => handleParameterFieldChange(rowIndex, 'inspectionMethod', e.target.value)}
                      placeholder="Vernier Caliper"
                    />
                  </td>
                  {row.observations.map((value, colIndex) => {
                    const outOfSpec = isObservationOutOfSpec(row.specification, value);
                    return (
                      <td key={colIndex} className="qir-col-obs">
                        <input
                          value={value}
                          onChange={(e) => handleObservationChange(rowIndex, colIndex, e.target.value)}
                          className={outOfSpec ? 'qir-out-of-spec' : ''}
                          title={outOfSpec ? 'Reading is outside the specification tolerance' : undefined}
                        />
                      </td>
                    );
                  })}
                  <td className="qir-col-del qir-no-print">
                    {formData.parameters.length > 1 && (
                      <button type="button" className="qir-remove-btn" onClick={() => removeParameterRow(rowIndex)} title="Delete row">
                        <FaTrash size={10} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Notes ────────────────────────────────────────────── */}
        <table className="qir-notes-table">
          <tbody>
            <tr>
              <td>
                <input name="allDimensionsNote" value={formData.allDimensionsNote} onChange={handleFieldChange} />
              </td>
            </tr>
            <tr>
              <td>
                <input name="samplesNote" value={formData.samplesNote} onChange={handleFieldChange} />
              </td>
            </tr>
            <tr>
              <td className="qir-remarks-row">
                <span className="qir-label-inline">Supplier Remarks: -</span>
                <input name="supplierRemarks" value={formData.supplierRemarks} onChange={handleFieldChange} />
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
                  <input name="footerRevNo" value={formData.footerRevNo} onChange={handleFieldChange} />
                </div>
                <div><span className="qir-label-inline">Rev. Date:</span>
                  <input type="date" name="footerRevDate" value={formData.footerRevDate} onChange={handleFieldChange} />
                </div>
              </td>
              <td className="qir-signoff-name">
                <span className="qir-label-inline">Inspected By:</span>
                <input name="inspectedBy" value={formData.inspectedBy} onChange={handleFieldChange} />
              </td>
              <td className="qir-signoff-name">
                <span className="qir-label-inline">Reviewed By:</span>
                <input name="reviewedBy" value={formData.reviewedBy} onChange={handleFieldChange} />
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}