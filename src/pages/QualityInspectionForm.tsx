import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaPlus, FaTrash,
  FaExclamationTriangle, FaClipboardCheck, FaSpinner,
  FaCalendarAlt, FaUserMinus,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './QualityInspectionForm.css';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useFormState } from '../context/FormStateContext';

/* ─────────────────────────── Types ─────────────────────────── */

interface ParameterRow {
  id: string;
  parameter: string;
  parameterId?: number;
  specification: string;
  inspectionMethod: string;
  inspectionMethodId?: number;
  observations: string[];
  isMandatory?: number;
  remarks?: string;
  detailId?: number;
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
  qualityTemplateId?: number | null;
  sourceType?: string;
  sourceId?: number;
}

interface ItemSuggestion {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  description: string;
}

interface CustomerSuggestion {
  id: number;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  mobile_no: string;
  email_id: string;
  contacts?: Array<{
    id: number;
    contact_name: string;
    mobile_no: string;
    email_id: string;
  }>;
}

interface ParameterSuggestion {
  id: number;
  parameter_name: string;
  parameter_code: string;
  parameter_group_id: number;
  default_method_id: number;
  unit: string | null;
  is_mandatory: number;
  is_active: number;
}

interface MethodSuggestion {
  id: number;
  method_name: string;
  description: string;
  is_active: number;
  created_at: string;
}

// Shape assumed for GET /employee — adjust displayField/labelField/
// subLabelField on the two AutocompleteInput usages below if the API
// returns different field names.
interface EmployeeSuggestion {
  id: number;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
}

interface TemplateInfo {
  id: number;
  template_name: string;
  template_code: string;
  company_id: number;
  item_id: number;
  description: string;
  is_default: number;
  is_active: number;
  parameters: Array<{
    parameter_id: number;
    parameter_name: string;
    parameter_code: string;
    inspection_method_id: number;
    inspection_method_name: string;
    specification: string;
    sequence_no: number;
    is_mandatory: number;
    remarks: string | null;
  }>;
}

/* ─────────────────────────── DatePicker Component ─────────────────────────── */

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  name?: string;
  label?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  error = false,
  disabled = false,
  name,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDateSelect = (day: number) => {
  const year = currentYear;
  const month = String(currentMonth + 1).padStart(2, '0');
  const selectedDay = String(day).padStart(2, '0');

  const formatted = `${year}-${month}-${selectedDay}`;

  onChange(formatted);
  setIsOpen(false);
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const d = new Date(val + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  };

  const handleInputBlur = () => {
    if (value && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // If not a valid date format, keep as is
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

 const today = new Date();

const todayYear = today.getFullYear();
const todayMonth = today.getMonth();
const todayDay = today.getDate();

const isToday = (day: number) => {
  return (
    currentYear === todayYear &&
    currentMonth === todayMonth &&
    day === todayDay
  );
};

  const isSelected = (day: number) => {
  if (!value) return false;

  const year = currentYear;
  const month = String(currentMonth + 1).padStart(2, '0');
  const selectedDay = String(day).padStart(2, '0');

  return `${year}-${month}-${selectedDay}` === value;
};

  // const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
  //   year: 'numeric',
  //   month: 'short',
  //   day: 'numeric'
  // }) : '';

  return (
    <div className="date-picker-wrapper" ref={wrapperRef}>
      {label && <label className="date-picker-label">{label}</label>}
      <div className="date-picker-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`date-picker-input ${className} ${error ? 'qir-input-error' : ''}`}
          disabled={disabled}
          name={name}
          autoComplete="off"
        />
        <button
          type="button"
          className="date-picker-toggle"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <FaCalendarAlt size={14} />
        </button>
        
      </div>

      {isOpen && !disabled && (
        <div className="date-picker-dropdown">
          <div className="date-picker-header">
            <button type="button" className="date-picker-nav" onClick={prevMonth}>‹</button>
            <span className="date-picker-month-year">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button type="button" className="date-picker-nav" onClick={nextMonth}>›</button>
          </div>
          <div className="date-picker-weekdays">
            {dayNames.map(day => (
              <span key={day} className="date-picker-weekday">{day}</span>
            ))}
          </div>
          <div className="date-picker-days">
            {Array.from({ length: firstDay }, (_, i) => (
              <span key={`empty-${i}`} className="date-picker-day-empty"></span>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isTodayDate = isToday(day);
              const isSelectedDate = isSelected(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={`date-picker-day ${isTodayDate ? 'date-picker-day-today' : ''} ${isSelectedDate ? 'date-picker-day-selected' : ''}`}
                  onClick={() => handleDateSelect(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-today-btn"
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                onChange(todayStr);
                setViewDate(new Date());
                setIsOpen(false);
              }}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                className="date-picker-clear-btn"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── Specification Input Component ─────────────────── */

interface SpecificationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

const SpecificationInput: React.FC<SpecificationInputProps> = ({
  value,
  onChange,
  placeholder = 'e.g. 9±0.2',
  className = '',
  error = false,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showHelper, setShowHelper] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
const updateDropdownPosition = () => {
  if (!inputRef.current) return;

  const rect = inputRef.current.getBoundingClientRect();

  const viewportPadding = 8;
  const availableWidth = window.innerWidth - viewportPadding * 2;

  const dropdownWidth = Math.min(
    rect.width,
    availableWidth
  );

  const maxLeft =
    window.innerWidth - dropdownWidth - viewportPadding;

  const left = Math.max(
    viewportPadding,
    Math.min(rect.left, maxLeft)
  );

  setDropdownPos({
    top: rect.bottom + 4,
    left,
    width: dropdownWidth
  });
};

  // Reposition (or track scroll/resize) while the helper is open so it never
  // gets clipped by the scrollable observation table wrapper.
  useEffect(() => {
    if (!showHelper) return;
    updateDropdownPosition();
    const reposition = () => updateDropdownPosition();
    // capture=true so we also catch scroll events from nested scroll
    // containers (e.g. the observation table's horizontal scrollbar).
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [showHelper]);

  const insertSymbol = (symbol: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = value.substring(0, start) + symbol + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + symbol.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);

    setShowHelper(false);
  };

  const insertTolerance = (format: string) => {
    switch (format) {
      case '±':
        insertSymbol('±');
        break;
      case '±0.1':
        insertSymbol('±0.1');
        break;
      case '±0.2':
        insertSymbol('±0.2');
        break;
      case '±0.5':
        insertSymbol('±0.5');
        break;
      case '±1.0':
        insertSymbol('±1.0');
        break;
      default:
        insertSymbol('±');
    }
  };

  return (
    <div className="specification-input-wrapper" ref={wrapperRef}>
      <div className="specification-input-container">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`specification-input ${className} ${error ? 'qir-input-error' : ''}`}
          disabled={disabled}
        />
        <button
          type="button"
          className="specification-tolerance-btn"
          onClick={() => setShowHelper(!showHelper)}
          disabled={disabled}
          title="Insert ± tolerance"
        >
          <FaUserMinus size={14} />
        </button>
      </div>

      {showHelper && !disabled && createPortal(
        <div
          className="specification-helper-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            minWidth: Math.max(dropdownPos.width, 200),
            zIndex: 999999,
          }}
        >
          <div className="specification-helper-header">
            <span>Insert Tolerance</span>
            <button
              type="button"
              className="specification-helper-close"
              onClick={() => setShowHelper(false)}
            >
              ×
            </button>
          </div>
          <div className="specification-helper-grid">
            <button
              type="button"
              className="specification-helper-btn"
              onClick={() => insertTolerance('±')}
            >
              ±
            </button>
            <button
              type="button"
              className="specification-helper-btn"
              onClick={() => insertTolerance('±0.1')}
            >
              ±0.1
            </button>
            <button
              type="button"
              className="specification-helper-btn"
              onClick={() => insertTolerance('±0.2')}
            >
              ±0.2
            </button>
            <button
              type="button"
              className="specification-helper-btn"
              onClick={() => insertTolerance('±0.5')}
            >
              ±0.5
            </button>
            <button
              type="button"
              className="specification-helper-btn"
              onClick={() => insertTolerance('±1.0')}
            >
              ±1.0
            </button>
          </div>
          <div className="specification-helper-examples">
            <span>Examples: 9±0.2, 25±0.5, 100±1.0</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

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

const createBlankParameterRow = (sampleCount: number): ParameterRow => ({
  id: nextId(),
  parameter: '',
  specification: '',
  inspectionMethod: '',
  observations: Array.from({ length: sampleCount }, () => ''),
});

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
  date: (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  })(),
  invoiceNo: '',
  invoiceQty: '',
  challanNoDate: '',
  reportNo: '',
  parameters: [createBlankParameterRow(DEFAULT_SAMPLE_COUNT)],
  sampleCount: DEFAULT_SAMPLE_COUNT,
  allDimensionsNote: 'ALL DIMENSIONS ARE IN MM',
  samplesNote: 'ALL SAMPLES ARE CHECKED RANDOMLY',
  supplierRemarks: 'Visually Accepted',
  footerRevNo: '00',
  footerRevDate: '',
  inspectedBy: '',
  reviewedBy: '',
  qualityTemplateId: null,
  sourceType: undefined,
  sourceId: undefined,
});

const unwrapDate = (value?: string | null): string => {
  if (!value) return '';
  return value.split('T')[0];
};

/* ─────────────── Autocomplete Components ─────────────────── */

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: any) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  apiEndpoint: string;
  displayField: string;
  labelField?: string;
  subLabelField?: string;
  searchParam?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search...',
  className = '',
  error = false,
  disabled = false,
  apiEndpoint,
  displayField,
  labelField,
  subLabelField,
  searchParam = 'search'
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 4;
    const preferredHeight = 240;

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;

    // Open upward when there is not enough room below the input.
    const openUpward =
      spaceBelow < preferredHeight && spaceAbove > spaceBelow;

    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(100, Math.min(preferredHeight, availableSpace));

    const width = Math.min(
      rect.width,
      window.innerWidth - viewportPadding * 2
    );

    const left = Math.max(
      viewportPadding,
      Math.min(
        rect.left,
        window.innerWidth - width - viewportPadding
      )
    );

    const top = openUpward
      ? Math.max(viewportPadding, rect.top - maxHeight - gap)
      : rect.bottom + gap;

    setDropdownPos({
      top,
      left,
      width,
      maxHeight
    });
  };

  // Keep the dropdown correctly positioned while it's open, including when
  // the page or an inner scroll container is scrolled.
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    const reposition = () => updateDropdownPosition();
    // capture=true so this also fires for scroll events inside nested
    // scroll containers (e.g. the observation table's own scrollbar).
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  const fetchSuggestions = async (searchTerm: string = '') => {
    const isEmployeeDropdown = apiEndpoint === '/employee';

    // Employee dropdowns should show all employees immediately when
    // the field is focused, even when the search box is empty.
    if (!searchTerm.trim() && !isEmployeeDropdown) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    try {
      const params: Record<string, any> = {
        page: 1,
        limit: isEmployeeDropdown ? 100 : 10
      };

      // Only send the search parameter when the user has typed something.
      if (searchTerm.trim()) {
        params[searchParam] = searchTerm.trim();
      }

      const response = await api.get(apiEndpoint, { params });

      if (response.data.success === 1) {
        let items: any[] = [];

        if (Array.isArray(response.data.data)) {
          items = response.data.data;
        } else if (response.data.data?.records) {
          items = response.data.data.records;
        } else if (response.data.data?.data) {
          items = response.data.data.data;
        }

        setSuggestions(items);
        setHighlightedIndex(-1);
        setIsOpen(items.length > 0);

        requestAnimationFrame(() => {
          updateDropdownPosition();
        });
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error(`Error fetching ${apiEndpoint} suggestions:`, error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (item: any) => {
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
      const target = event.target as Node;
      // The dropdown is rendered in a portal (document.body), so it lives
      // outside wrapperRef's DOM subtree — check both before closing.
      const insideWrapper = !!wrapperRef.current && wrapperRef.current.contains(target);
      const insideDropdown = !!dropdownRef.current && dropdownRef.current.contains(target);
      if (!insideWrapper && !insideDropdown) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const getDisplayValue = (item: any) => {
    return item[displayField] || '';
  };

  const getLabelValue = (item: any) => {
    if (labelField) {
      return item[labelField] || '';
    }
    return '';
  };

  const getSubLabelValue = (item: any) => {
    if (subLabelField) {
      return item[subLabelField] || '';
    }
    return '';
  };

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
            if (apiEndpoint === '/employee') {
              fetchSuggestions(value);
            } else if (value.trim()) {
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

      {isOpen && suggestions.length > 0 && createPortal(
        <ul
          ref={dropdownRef}
          className="autocomplete-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: dropdownPos.maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: 0,
            listStyle: 'none',
            zIndex: 999999,
            boxSizing: 'border-box',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
          }}
        >
          {suggestions.map((item, index) => (
            <li
              key={item.id || index}
              onClick={() => handleSuggestionClick(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '9px 12px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                overflow: 'hidden',
                backgroundColor: index === highlightedIndex ? '#f3f4f6' : 'white',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{
                fontWeight: 600,
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {getDisplayValue(item)}
              </div>
              {getLabelValue(item) && (
                <div style={{
                  fontSize: '10.5px',
                  color: '#6b7280',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '1px'
                }}>
                  {getLabelValue(item)}
                  {getSubLabelValue(item) && ` | ${getSubLabelValue(item)}`}
                </div>
              )}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
};

/* ─────────────── Popup 1: Template Creation Modal ──────────────────────── */

interface TemplateCreationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onSkip: () => void;
}

const TemplateCreationModal: React.FC<TemplateCreationModalProps> = ({
  isOpen,
  onConfirm,
  onSkip
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{
          margin: '0 0 12px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          Create Quality Template
        </h2>

        <p style={{ margin: '0 0 20px 0', color: '#6b7280', lineHeight: '1.6' }}>
          No Quality Template exists for this Item.<br />
          Would you like to create one using this inspection?
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px'
        }}>
          <button
            onClick={onSkip}
            style={{
              padding: '8px 20px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Skip
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Popup 2: Template Update Modal ──────────────────────── */

interface TemplateUpdateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onSkip: () => void;
}

const TemplateUpdateModal: React.FC<TemplateUpdateModalProps> = ({
  isOpen,
  onConfirm,
  onSkip
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{
          margin: '0 0 12px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          Template Modified
        </h2>

        <p style={{ margin: '0 0 20px 0', color: '#6b7280', lineHeight: '1.6' }}>
          Inspection template has changed.<br />
          Would you like to update the template?
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px'
        }}>
          <button
            onClick={onSkip}
            style={{
              padding: '8px 20px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Don't Update
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function QualityInspectionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const isViewMode = searchParams.get('view') === '1';

  const isEditMode = !!id && id !== 'new';

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const formState = useFormState();

  const [formData, setFormData] = useState<InspectionForm>(defaultFormData());
  const [recordName, setRecordName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const [currentTemplate, setCurrentTemplate] = useState<TemplateInfo | null>(null);
  const [, setOriginalTemplateRows] = useState<ParameterRow[]>([]);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  const [showTemplateCreationModal, setShowTemplateCreationModal] = useState(false);
  const [showTemplateUpdateModal, setShowTemplateUpdateModal] = useState(false);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});
  const setRef = (key: string) => (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    inputRefs.current[key] = el;
  };

  // Check if coming from a source (Delivery Challan, Sales Invoice, etc.)
  const isFromSource = !!formData.sourceType;

  // Get the source path for navigation
  const getSourcePath = () => {
    const paths: Record<string, string> = {
      'delivery_challan': '/delivery-challan',
      'sales_invoice': '/sales-bill',
      'sales-bill': '/sales-bill',
      'purchase_order': '/purchase-order',
      'purchase_invoice': '/purchase-invoice',
      'purchase-invoice': '/purchase-invoice',
      'sales_order': '/sales-order',
      'quotation': '/quotation',
      'grn': '/grn',
      'material_request': '/material-request',
      'supplier_quotation': '/supplier-quotation',
      'job_card': '/job-cards',
      'work_order': '/work-order',
      'stock_entry': '/stock-entry',
    };

    const basePath = paths[formData.sourceType || ''] || '/quality-inspection';
    if (formData.sourceId) {
      return `${basePath}/edit/${formData.sourceId}?returnFromQI=1`;
    }
    if (formData.sourceType) {
      return `${basePath}/new?returnFromQI=1`;
    }
    return '/quality-inspection';
  };

  /* ─── Read query parameters ────────────────────────────────────── */

  useEffect(() => {
    // Get all query params
    const docNoParam = searchParams.get('docNo');
    const sourceType = searchParams.get('sourceType');
    const sourceId = searchParams.get('sourceId');
    const partProductNameParam = searchParams.get('partProductName');
    const partNoParam = searchParams.get('partNo');
    const customerNameParam = searchParams.get('customerName');
    const challanNoDateParam = searchParams.get('challanNoDate');
    const invoiceQtyParam = searchParams.get('invoiceQty');
    const reportNoParam = searchParams.get('reportNo');

    // Set docNo, sourceType, sourceId
    if (docNoParam) {
      setFormData(prev => ({
        ...prev,
        docNo: docNoParam,
        sourceType: sourceType || undefined,
        sourceId: sourceId ? parseInt(sourceId, 10) : undefined,
      }));
    }

    // Auto-populate partProductName and partNo from URL params
    if (partProductNameParam) {
      const decodedName = decodeURIComponent(partProductNameParam);
      setFormData(prev => ({
        ...prev,
        partProductName: decodedName,
      }));
    }

    if (partNoParam) {
      const decodedPartNo = decodeURIComponent(partNoParam);
      setFormData(prev => ({
        ...prev,
        partNo: decodedPartNo,
      }));
    }

    // Auto-populate customer name
    if (customerNameParam) {
      const decodedCustomerName = decodeURIComponent(customerNameParam);
      setFormData(prev => ({
        ...prev,
        customerName: decodedCustomerName,
      }));
    }

    // Auto-populate challan no / date
    if (challanNoDateParam) {
      const decodedChallanNoDate = decodeURIComponent(challanNoDateParam);
      setFormData(prev => ({
        ...prev,
        challanNoDate: decodedChallanNoDate,
      }));
    }

    // Auto-populate invoice qty
    if (invoiceQtyParam) {
      const decodedInvoiceQty = decodeURIComponent(invoiceQtyParam);
      setFormData(prev => ({
        ...prev,
        invoiceQty: decodedInvoiceQty,
      }));
    }

    // Auto-populate report no
    if (reportNoParam) {
      const decodedReportNo = decodeURIComponent(reportNoParam);
      setFormData(prev => ({
        ...prev,
        reportNo: decodedReportNo,
      }));
    }

    // If a pending inspection already exists, never replace its saved rows
    // and observations with a newly fetched template.
    const savedSourceForTemplate = sourceType
      ? formState.getFormState(sourceType, sourceId ? sourceId : undefined)?.formData
      : null;
    const hasPendingInspection = !!savedSourceForTemplate?.pendingQualityInspection?.formData;

    if (partProductNameParam && !hasPendingInspection) {
      const decodedName = decodeURIComponent(partProductNameParam);
      // Search for the item by name
      const searchItemAndLoadTemplate = async () => {
        try {
          const response = await api.get('/item', {
            params: {
              page: 1,
              limit: 10,
              search: decodedName
            }
          });

          if (response.data.success === 1) {
            let items = [];
            if (Array.isArray(response.data.data)) {
              items = response.data.data;
            } else if (response.data.data?.records) {
              items = response.data.data.records;
            } else if (response.data.data?.data) {
              items = response.data.data.data;
            }

            // Find exact match by name
            const matchedItem = items.find(
              (item: any) => item.item_name === decodedName || item.item_code === partNoParam
            );

            if (matchedItem) {
              setSelectedItemId(matchedItem.id);
              // Load the quality template for this item
              await loadQualityTemplate(matchedItem.id);
              toast.success(`Loaded item: ${matchedItem.item_name}`);
            }
          }
        } catch (error) {
          console.error('Error searching for item:', error);
          // Don't show error toast - just use the name as provided
        }
      };

      searchItemAndLoadTemplate();
    }

    // Check if returning from another module and restore state
    const returnFlag = searchParams.get('returnFromQI');
    if (returnFlag === '1' && sourceType) {
      const moduleType = sourceType;
      const savedState = formState.restoreFormState(moduleType);
      if (savedState) {
        toast.success(`Restored data from ${moduleType}`);
        // Clean up URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('returnFromQI');
        window.history.replaceState({}, document.title, `${window.location.pathname}?${newParams.toString()}`);
      }
    }
  }, [searchParams, formState]);

  // const compareParameters = (templateParams: any[], formParams: ParameterRow[]): boolean => {
  //   if (templateParams.length !== formParams.length) {
  //     return true;
  //   }

  //   const sortedTemplate = [...templateParams].sort((a, b) => a.parameter_id - b.parameter_id);
  //   const sortedForm = [...formParams].sort((a, b) => (a.parameterId || 0) - (b.parameterId || 0));

  //   for (let i = 0; i < sortedTemplate.length; i++) {
  //     const t = sortedTemplate[i];
  //     const f = sortedForm[i];

  //     if (t.parameter_id !== f.parameterId) return true;
  //     if (t.inspection_method_id !== f.inspectionMethodId) return true;
  //     if (t.specification !== f.specification) return true;
  //     if ((t.remarks || '') !== (f.remarks || '')) return true;
  //     if ((t.is_mandatory || 1) !== (f.isMandatory || 1)) return true;
  //   }

  //   return false;
  // };

  const loadQualityTemplate = async (itemId: number) => {
    setLoadingTemplate(true);
    setTemplateLoaded(false);

    try {
      const response = await api.get(`/quality-template/by-item/${itemId}`);

      if (response.data.success === 1 && response.data.data) {
        const templateData = response.data.data;

        setCurrentTemplate({
          id: templateData.id,
          template_name: templateData.template_name,
          template_code: templateData.template_code,
          company_id: templateData.company_id,
          item_id: templateData.item_id,
          description: templateData.description,
          is_default: templateData.is_default,
          is_active: templateData.is_active,
          parameters: templateData.parameters
        });

        const sampleCount = formData.sampleCount || 5;
        const blanks = () => Array.from({ length: sampleCount }, () => '');

        const parameters: ParameterRow[] = templateData.parameters.map((param: any) => ({
          id: nextId(),
          parameter: param.parameter_name,
          parameterId: param.parameter_id,
          specification: param.specification,
          inspectionMethod: param.inspection_method_name,
          inspectionMethodId: param.inspection_method_id,
          observations: blanks(),
          isMandatory: param.is_mandatory,
          remarks: param.remarks,
          detailId: param.detail_id
        }));

        setOriginalTemplateRows(JSON.parse(JSON.stringify(parameters)));

        setFormData(prev => ({
          ...prev,
          parameters: parameters,
          qualityTemplateId: templateData.id,
          partProductName: prev.partProductName || templateData.template_name,
          partNo: prev.partNo || templateData.template_code,
        }));

        setTemplateLoaded(true);
        toast.success(`Loaded template: ${templateData.template_name}`);
      } else if (response.data.success === 0) {
        setCurrentTemplate(null);
        setOriginalTemplateRows([]);
        setTemplateLoaded(false);

        const emptyParameters: ParameterRow[] = [
          createBlankParameterRow(formData.sampleCount || 5)
        ];

        setFormData(prev => ({
          ...prev,
          parameters: emptyParameters,
          qualityTemplateId: null,
        }));

        toast('No Quality Template found for this item. Starting with empty grid.');
      }
    } catch (error: any) {
      console.error('Error loading quality template:', error);
      setCurrentTemplate(null);
      setOriginalTemplateRows([]);
      setTemplateLoaded(false);

      const emptyParameters: ParameterRow[] = [
        createBlankParameterRow(formData.sampleCount || 5)
      ];

      setFormData(prev => ({
        ...prev,
        parameters: emptyParameters,
        qualityTemplateId: null,
      }));

      toast('Could not load Quality Template. Starting with empty grid.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const clearTemplateData = () => {
    setCurrentTemplate(null);
    setOriginalTemplateRows([]);
    setTemplateLoaded(false);
    setFormData(prev => ({
      ...prev,
      qualityTemplateId: null,
    }));
  };

  const loadRecordIntoForm = (record: any) => {
    setRecordName(record.inspection_no ?? null);
    const sampleCount = record.details?.[0]?.observations?.length || DEFAULT_SAMPLE_COUNT;

    const parameters: ParameterRow[] = Array.isArray(record.details) && record.details.length > 0
      ? record.details.map((d: any) => ({
        id: nextId(),
        parameter: d.parameter_name || `Parameter ${d.parameter_id}`,
        parameterId: d.parameter_id,
        specification: d.specification || '',
        inspectionMethod: d.inspection_method_name || '',
        inspectionMethodId: d.inspection_method_id,
        observations: Array.isArray(d.observations) && d.observations.length > 0
          ? d.observations.map((obs: any) => obs.observed_value || '')
          : Array.from({ length: sampleCount }, () => ''),
        isMandatory: d.is_mandatory,
        remarks: d.remarks,
      }))
      : [createBlankParameterRow(sampleCount)];

    if (record.item_id) {
      setSelectedItemId(record.item_id);

      if (record.quality_template_id) {
        setFormData(prev => ({
          ...prev,
          qualityTemplateId: record.quality_template_id,
        }));
      }
    }

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
      qualityTemplateId: record.quality_template_id || prev.qualityTemplateId,
    }));
  };

  const fetchInspectionById = async (recordId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const response = await api.get(`/quality-inspection/${recordId}`);
      if (response.data.success === 1 && response.data.data) {
        const record = response.data.data;
        loadRecordIntoForm(record);

        if (record.quality_template_id && record.item_id) {
          setFormData(prev => ({
            ...prev,
            qualityTemplateId: record.quality_template_id,
          }));
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

  // Restore an inspection that is already attached to a Delivery Challan.
  // This is used by both Edit Inspection and View Inspection so every field,
  // parameter and observation comes back exactly as it was entered.
  useEffect(() => {
    if (isEditMode) return;

    const sourceType = searchParams.get('sourceType');
    const sourceId = searchParams.get('sourceId');
    if (!sourceType) return;

    const savedSource = formState.getFormState(
      sourceType,
      sourceId ? sourceId : undefined
    )?.formData;

    // Restore the exact pending inspection, including every parameter and
    // observation. Do not rebuild the form from URL values.
    const pendingInspection = savedSource?.pendingQualityInspection;
    const pending = pendingInspection?.formData;

    if (!pending) return;

    const restored = JSON.parse(JSON.stringify(pending));
    restored.sourceType = restored.sourceType || sourceType;
    if (!restored.sourceId && sourceId) restored.sourceId = Number(sourceId);

    setFormData(restored);
    setSelectedItemId(
      pendingInspection?.selectedItemId ??
      restored.itemId ??
      restored.parameters?.find((p: any) => p?.parameterId)?.parameterId ??
      null
    );
    setRecordName(restored.reportNo || null);
  }, [isEditMode, searchParams, formState]);

  useEffect(() => {
    if (autoPrint && !loadingRecord) {
      const timer = setTimeout(() => handlePrint(), 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, loadingRecord]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePartProductNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, partProductName: value }));
    if (selectedItemId !== null) {
      setSelectedItemId(null);
      clearTemplateData();
    }
    if (errors.partProductName) setErrors(prev => ({ ...prev, partProductName: '' }));
  };

  const handlePartProductSelect = async (item: ItemSuggestion) => {
    setFormData(prev => ({
      ...prev,
      partProductName: item.item_name,
      partNo: item.item_code
    }));
    setSelectedItemId(item.id);
    if (errors.partProductName) setErrors(prev => ({ ...prev, partProductName: '' }));

    await loadQualityTemplate(item.id);
  };

  const handleCustomerNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, customerName: value }));
    if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
  };

  const handleCustomerSelect = (item: CustomerSuggestion) => {
    setFormData(prev => ({
      ...prev,
      customerName: item.customer_name
    }));
    if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
  };

  const handleInspectedByChange = (value: string) => {
    setFormData(prev => ({ ...prev, inspectedBy: value }));
  };

  const handleInspectedBySelect = (item: EmployeeSuggestion) => {
    setFormData(prev => ({ ...prev, inspectedBy: item.employee_name }));
  };

  const handleReviewedByChange = (value: string) => {
    setFormData(prev => ({ ...prev, reviewedBy: value }));
  };

  const handleReviewedBySelect = (item: EmployeeSuggestion) => {
    setFormData(prev => ({ ...prev, reviewedBy: item.employee_name }));
  };

  const handleParameterFieldChange = (rowIndex: number, field: 'parameter' | 'specification' | 'inspectionMethod', value: string) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      parameters[rowIndex] = { ...parameters[rowIndex], [field]: value };
      if (field === 'parameter') {
        parameters[rowIndex].parameterId = undefined;
      }
      if (field === 'inspectionMethod') {
        parameters[rowIndex].inspectionMethodId = undefined;
      }
      return { ...prev, parameters };
    });
  };

  const handleParameterSelect = (rowIndex: number, item: ParameterSuggestion) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      parameters[rowIndex] = {
        ...parameters[rowIndex],
        parameter: item.parameter_name,
        parameterId: item.id
      };
      return { ...prev, parameters };
    });
  };

  const handleMethodSelect = (rowIndex: number, item: MethodSuggestion) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      parameters[rowIndex] = {
        ...parameters[rowIndex],
        inspectionMethod: item.method_name,
        inspectionMethodId: item.id
      };
      return { ...prev, parameters };
    });
  };

  const handleParameterNameChange = (rowIndex: number, value: string) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      parameters[rowIndex] = {
        ...parameters[rowIndex],
        parameter: value,
        parameterId: undefined
      };
      return { ...prev, parameters };
    });
  };

  const handleMethodNameChange = (rowIndex: number, value: string) => {
    setFormData(prev => {
      const parameters = [...prev.parameters];
      parameters[rowIndex] = {
        ...parameters[rowIndex],
        inspectionMethod: value,
        inspectionMethodId: undefined
      };
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
        createBlankParameterRow(prev.sampleCount),
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

  const outOfSpecCount = formData.parameters.reduce((count, row) => {
    return count + row.observations.filter(v => isObservationOutOfSpec(row.specification, v)).length;
  }, 0);

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

  // ===== FIXED: validate with observations check and visual indicators =====
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Basic required fields
    if (!formData.docNo.trim()) newErrors.docNo = 'Doc No is required';
    if (!formData.reportNo.trim()) newErrors.reportNo = 'Report No is required';
    if (!formData.partProductName.trim()) newErrors.partProductName = 'Part / Product Name is required';
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer Name is required';
    if (!formData.date) newErrors.date = 'Date is required';

    // Check each parameter row
    let hasObservationError = false;
    formData.parameters.forEach((row, index) => {
      if (!row.parameter.trim()) {
        newErrors[`parameter_${index}`] = 'Parameter name is required';
      }
      if (!row.inspectionMethod.trim()) {
        newErrors[`method_${index}`] = 'Inspection method is required';
      }

      // ===== CRITICAL: Check if at least one observation has a value =====
      const hasObservation = row.observations.some(obs => obs && obs.trim() !== '');
      if (!hasObservation) {
        newErrors[`observation_${index}`] = 'At least one observation value is required';
        hasObservationError = true;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Show a toast message for observation errors
      if (hasObservationError) {
        toast.error('Please fill in at least one observation value for each parameter');
      } else {
        toast.error('Please fill in all required fields');
      }

      const firstKey = Object.keys(newErrors)[0];
      inputRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputRefs.current[firstKey]?.focus();
      return false;
    }
    return true;
  };

  const detectNewParametersAndMethods = () => {
    const parameterNames = formData.parameters
      .map(row => row.parameter.trim())
      .filter(name => name.length > 0);

    const methodNames = formData.parameters
      .map(row => row.inspectionMethod.trim())
      .filter(name => name.length > 0);

    const newParameters = formData.parameters
      .filter(row => {
        const hasNoId = !row.parameterId;
        const hasName = row.parameter.trim().length > 0;
        return hasNoId && hasName;
      })
      .map(row => row.parameter.trim())
      .filter((name, index, self) => self.indexOf(name) === index);

    const newMethods = formData.parameters
      .filter(row => {
        const hasNoId = !row.inspectionMethodId;
        const hasName = row.inspectionMethod.trim().length > 0;
        return hasNoId && hasName;
      })
      .map(row => row.inspectionMethod.trim())
      .filter((name, index, self) => self.indexOf(name) === index);

    return {
      newParameters,
      newMethods,
      allParameterNames: parameterNames,
      allMethodNames: methodNames
    };
  };

  const saveMissingMasters = async (newParameters: string[], newMethods: string[]) => {
    console.log('Saving missing masters...');
    console.log('New Parameters to save:', newParameters);
    console.log('New Methods to save:', newMethods);

    const savedParameters: { [key: string]: number } = {};
    const savedMethods: { [key: string]: number } = {};

    for (const paramName of newParameters) {
      try {
        const response = await api.post('/quality-parameter', {
          parameter_name: paramName,
          parameter_code: paramName.substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
          parameter_group_id: 1,
          default_method_id: null,
          unit: null,
          description: `Auto-created from inspection form`,
          is_mandatory: 0,
          is_active: 1
        });

        if (response.data.success === 1 && response.data.data) {
          const paramData = response.data.data;
          const id = paramData.id || paramData.parameter_id || paramData.insertId;
          if (id) {
            savedParameters[paramName] = id;
            console.log(`✅ Parameter "${paramName}" saved with ID: ${id}`);
          } else {
            console.error(`❌ Parameter "${paramName}" saved but no ID returned:`, paramData);
            throw new Error(`No ID returned for parameter: ${paramName}`);
          }
        } else {
          throw new Error(response.data.message || `Failed to save parameter: ${paramName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to save parameter "${paramName}":`, error);
        throw new Error(`Failed to save parameter: ${paramName}`);
      }
    }

    for (const methodName of newMethods) {
      try {
        const response = await api.post('/inspection-method', {
          method_name: methodName,
          description: `Auto-created from inspection form`,
          is_active: 1
        });

        if (response.data.success === 1 && response.data.data) {
          const methodData = response.data.data;
          const id = methodData.id || methodData.method_id || methodData.insertId;
          if (id) {
            savedMethods[methodName] = id;
            console.log(`✅ Method "${methodName}" saved with ID: ${id}`);
          } else {
            console.error(`❌ Method "${methodName}" saved but no ID returned:`, methodData);
            throw new Error(`No ID returned for method: ${methodName}`);
          }
        } else {
          throw new Error(response.data.message || `Failed to save method: ${methodName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to save method "${methodName}":`, error);
        throw new Error(`Failed to save method: ${methodName}`);
      }
    }

    return { savedParameters, savedMethods };
  };

  const createTemplateFromForm = async () => {
    try {
      const { newParameters, newMethods } = detectNewParametersAndMethods();

      let savedParameters: { [key: string]: number } = {};
      let savedMethods: { [key: string]: number } = {};

      if (newParameters.length > 0 || newMethods.length > 0) {
        const result = await saveMissingMasters(newParameters, newMethods);
        savedParameters = result.savedParameters;
        savedMethods = result.savedMethods;
      }

      const templatePayload = {
        template_name: `${formData.partProductName || 'Inspection'} Template`,
        template_code: `TEMP-${(formData.partNo || 'INSP').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        company_id: 1,
        item_id: selectedItemId || 22,
        description: `Created from inspection ${recordName || 'QIR'}`,
        is_default: 1,
        is_active: 1,
        parameters: formData.parameters.map((row, index) => {
          let parameterId = row.parameterId;
          if (!parameterId && row.parameter.trim()) {
            const paramName = row.parameter.trim();
            if (savedParameters[paramName]) {
              parameterId = savedParameters[paramName];
            }
          }

          let methodId = row.inspectionMethodId;
          if (!methodId && row.inspectionMethod.trim()) {
            const methodName = row.inspectionMethod.trim();
            if (savedMethods[methodName]) {
              methodId = savedMethods[methodName];
            }
          }

          return {
            parameter_id: parameterId || (index + 1),
            inspection_method_id: methodId || 1,
            specification: row.specification || '',
            sequence_no: index + 1,
            is_mandatory: row.isMandatory ?? 1,
            remarks: row.remarks || null
          };
        })
      };

      const response = await api.post('/quality-template', templatePayload);

      if (response.data.success === 1) {
        toast.success('Quality Template created successfully!');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to create template');
      }
    } catch (err: any) {
      console.error('Error creating template:', err);
      const message = err.response?.data?.message || err.message || 'Failed to create template';
      toast.error(message);
      return false;
    }
  };

  const updateTemplateFromForm = async () => {
    if (!currentTemplate) {
      toast.error('No template to update');
      return false;
    }

    try {
      const { newParameters, newMethods } = detectNewParametersAndMethods();

      let savedParameters: { [key: string]: number } = {};
      let savedMethods: { [key: string]: number } = {};

      if (newParameters.length > 0 || newMethods.length > 0) {
        const result = await saveMissingMasters(newParameters, newMethods);
        savedParameters = result.savedParameters;
        savedMethods = result.savedMethods;
      }

      const templatePayload = {
        id: currentTemplate.id,
        template_name: currentTemplate.template_name,
        template_code: currentTemplate.template_code,
        company_id: currentTemplate.company_id,
        item_id: currentTemplate.item_id,
        description: currentTemplate.description || `Updated from inspection ${recordName || 'QIR'}`,
        is_default: currentTemplate.is_default,
        is_active: 1,
        parameters: formData.parameters.map((row, index) => {
          let parameterId = row.parameterId;
          if (!parameterId && row.parameter.trim()) {
            const paramName = row.parameter.trim();
            if (savedParameters[paramName]) {
              parameterId = savedParameters[paramName];
            }
          }

          let methodId = row.inspectionMethodId;
          if (!methodId && row.inspectionMethod.trim()) {
            const methodName = row.inspectionMethod.trim();
            if (savedMethods[methodName]) {
              methodId = savedMethods[methodName];
            }
          }

          return {
            id: row.detailId || undefined,
            parameter_id: parameterId || (index + 1),
            inspection_method_id: methodId || 1,
            specification: row.specification || '',
            sequence_no: index + 1,
            is_mandatory: row.isMandatory ?? 1,
            remarks: row.remarks || null
          };
        })
      };

      const response = await api.put('/quality-template', templatePayload);

      if (response.data.success === 1) {
        toast.success('Quality Template updated successfully!');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update template');
      }
    } catch (err: any) {
      console.error('Error updating template:', err);
      const message = err.response?.data?.message || err.message || 'Failed to update template';
      toast.error(message);
      return false;
    }
  };

  // ===== SAVE INSPECTION AS PENDING DRAFT =====
  // A Quality Inspection created from a Delivery Challan is intentionally NOT
  // persisted here. The complete inspection is kept in FormState and is saved
  // together with the Delivery Challan when the user clicks Submit on the DC.
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();

      if (formData.sourceType === 'delivery_challan') {
        const existingDcState =
          formState.getFormState('delivery_challan', formData.sourceId)?.formData || {};

        formState.saveFormState('delivery_challan', {
          ...existingDcState,
          pendingQualityInspection: {
            formData: JSON.parse(JSON.stringify(formData)),
            payload: JSON.parse(JSON.stringify(payload)),
            selectedItemId,
            savedAt: new Date().toISOString()
          },
          qualityInspection: true
        }, formData.sourceId);

        toast.success('Inspection saved. Complete and submit the Delivery Challan to save both.');
        // Navigate back to the exact source page (new or edit) that this
        // inspection was created from, instead of always going to "new".
        navigate(getSourcePath());
        return;
      }

      // Standalone QI records retain immediate persistence.
      const response = isEditMode && recordName
        ? await api.put('/quality-inspection', { ...payload, id: parseInt(id!) })
        : await api.post('/quality-inspection', payload);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to save inspection report');
      }

      toast.success(isEditMode ? 'Inspection report updated!' : 'Inspection report saved!');
      navigate('/quality-inspection');
    } catch (err: any) {
      console.error('Error saving inspection report:', err);
      const message = err.response?.data?.message || err.message || 'Failed to save inspection report';
      setApiError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    setShowTemplateCreationModal(false);
    setSaving(true);

    try {
      const success = await createTemplateFromForm();
      if (success) {
        const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
        if (formData.sourceType) {
          formState.clearFormState(formData.sourceType);
        }
        navigate(targetPath);
      } else {
        const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
        if (formData.sourceType) {
          formState.clearFormState(formData.sourceType);
        }
        navigate(targetPath);
      }
    } catch (err) {
      console.error('Error in template creation:', err);
      const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
      if (formData.sourceType) {
        formState.clearFormState(formData.sourceType);
      }
      navigate(targetPath);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipTemplateCreation = () => {
    setShowTemplateCreationModal(false);
    if (formData.sourceType) {
      formState.clearFormState(formData.sourceType);
    }
    const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
    navigate(targetPath);
  };

  const handleUpdateTemplate = async () => {
    setShowTemplateUpdateModal(false);
    setSaving(true);

    try {
      const success = await updateTemplateFromForm();
      if (success) {
        if (formData.sourceType) {
          formState.clearFormState(formData.sourceType);
        }
        const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
        navigate(targetPath);
      } else {
        if (formData.sourceType) {
          formState.clearFormState(formData.sourceType);
        }
        const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
        navigate(targetPath);
      }
    } catch (err) {
      console.error('Error in template update:', err);
      if (formData.sourceType) {
        formState.clearFormState(formData.sourceType);
      }
      const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
      navigate(targetPath);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipTemplateUpdate = () => {
    setShowTemplateUpdateModal(false);
    if (formData.sourceType) {
      formState.clearFormState(formData.sourceType);
    }
    const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
    navigate(targetPath);
  };

  // ===== FIXED: buildApiPayload - Use 0 as fallback =====
  const buildApiPayload = () => {
    const inspectionNo = isEditMode && recordName ? recordName : `QIR-${Date.now().toString(36).toUpperCase()}`;
    const overallResult = outOfSpecCount > 0 ? 'Fail' : 'Pass';

    const details = formData.parameters.map((param) => {
      const paramOutOfSpec = param.observations.some(v => isObservationOutOfSpec(param.specification, v));
      const paramResult = paramOutOfSpec ? 'Fail' : 'Pass';

      const observations = param.observations.map((value, obsIndex) => ({
        sample_no: obsIndex + 1,
        observed_value: value || null,
        result: value && isObservationOutOfSpec(param.specification, value) ? 'Fail' : 'Pass',
        remarks: null
      }));

      // Use 0 as fallback - will be updated in performSave if needed
      return {
        parameter_id: param.parameterId || 0,
        inspection_method_id: param.inspectionMethodId || 0,
        specification: param.specification || null,
        result: paramResult,
        remarks: null,
        observations: observations
      };
    });

    const inspectionTypeMap: { [key: string]: string } = {
      'Incoming Inspection': 'Incoming',
      'In Process Inspection': 'In Process',
      'Final Inspection': 'Final',
      'Dispatch Inspection': 'Dispatch'
    };

    const inspectionType = inspectionTypeMap['Final Inspection'] || 'Final';
    const status = outOfSpecCount > 0 ? 'Rejected' : 'Accepted';

    const payload: any = {
      inspection_no: inspectionNo,
      company_id: 1,
      inspection_date: formData.date || null,
      inspection_type: inspectionType,
      reference_type: 'Purchase Order',
      reference_id: 0,
      item_id: selectedItemId || 22,
      quality_template_id: formData.qualityTemplateId || null,
      warehouse_id: null,
      batch_id: null,
      customer_id: 0,
      supplier_id: 0,
      drawing_no: formData.drawingNo || null,
      revision_no: formData.revNo || null,
      inspection_qty: parseInt(formData.invoiceQty) || 0,
      accepted_qty: outOfSpecCount > 0 ? 0 : (parseInt(formData.invoiceQty) || 0),
      rejected_qty: outOfSpecCount || 0,
      status: status,
      overall_result: overallResult,
      remarks: formData.supplierRemarks || null,
      inspected_by: formData.inspectedBy || null,
      reviewed_by: formData.reviewedBy || null,
      approved_by: null,
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

    // Add source info if coming from another module
    if (formData.sourceType && formData.sourceId) {
      payload.source_type = formData.sourceType;
      payload.source_id = formData.sourceId;
    }

    return payload;
  };

  const handleBack = () => {
    if (formData.sourceType === 'delivery_challan') {
      // Return to the exact DC (new or edit) this inspection was opened from,
      // without discarding whatever pendingQualityInspection may already be
      // saved in FormState for it.
      navigate(getSourcePath());
      return;
    }
    if (formData.sourceType) {
      formState.clearFormState(formData.sourceType);
    }
    const targetPath = isFromSource ? getSourcePath() : '/quality-inspection';
    navigate(targetPath);
  };

  /* ─────────────────────────── Render ─────────────────────────── */

  return (
    <div className={`qir-page ${theme}-theme ${isViewMode ? 'qir-view-mode' : ''}`}>
      <div className="qir-header-wrap qir-no-print">
        <div className="qir-header-row">
          <button type="button" className="qir-back-btn" onClick={handleBack}>
            <FaArrowLeft size={12} /> Back
          </button>
          {/*<h1 className="qir-title"><FaClipboardCheck size={15} /> {isViewMode ? 'View Inspection Report' : isEditMode ? 'Edit Inspection Report' : 'New Inspection Report'}</h1>*/}

          {apiError && (
            <div className="qir-error-pill">
              <FaExclamationTriangle size={11} /> {apiError}
            </div>
          )}

          {loadingTemplate && (
            <div className="qir-error-pill">
              <FaSpinner className="spinning" size={11} /> Loading template...
            </div>
          )}

          {templateLoaded && currentTemplate && (
            <div className="qir-error-pill" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
              <FaClipboardCheck size={11} /> Template: {currentTemplate.template_name}
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
            {!isViewMode && <button type="button" className="qir-submit-btn" onClick={handleSave} disabled={saving}>
              {saving ? <FaSpinner className="spinning" size={12} /> : <FaSave size={12} />} {saving ? 'Saving...' : 'Save'}
            </button>}
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
                  readOnly={!!formData.sourceType}
                  style={formData.sourceType ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
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
                  apiEndpoint="/item"
                  displayField="item_name"
                  labelField="item_code"
                  subLabelField="item_group"
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
                <DatePicker
                  value={formData.date}
                  onChange={(value) => handleDateChange('date', value)}
                  className={errors.date ? 'qir-input-error' : ''}
                  error={!!errors.date}
                  name="date"
                />
              </td>
            </tr>
            {/* ── Hide these fields when coming from a source ── */}
            {!isFromSource && (
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
            )}
            <tr>
              <td className="qir-meta-label">Customer Name :</td>
              <td className="qir-meta-value" colSpan={2}>
                <AutocompleteInput
                  value={formData.customerName}
                  onChange={handleCustomerNameChange}
                  onSelect={handleCustomerSelect}
                  placeholder="Search and select customer..."
                  className={errors.customerName ? 'qir-input-error' : ''}
                  apiEndpoint="/customer"
                  displayField="customer_name"
                  labelField="customer_type"
                  subLabelField="customer_group"
                />
              </td>
              <td className="qir-meta-label">Challan No / Date :</td>
              <td className="qir-meta-value" colSpan={2}>
                <input
                  name="challanNoDate"
                  value={formData.challanNoDate}
                  onChange={handleFieldChange}
                  ref={setRef('challanNoDate')}
                  readOnly={isFromSource}
                  style={isFromSource ? { backgroundColor: '#f9fafb', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td className="qir-meta-label">Invoice Qty :</td>
              <td className="qir-meta-value">
                <input
                  name="invoiceQty"
                  value={formData.invoiceQty}
                  onChange={handleFieldChange}
                  placeholder="Nos"
                  ref={setRef('invoiceQty')}
                  readOnly={isFromSource}
                  style={isFromSource ? { backgroundColor: '#f9fafb', cursor: 'not-allowed' } : {}}
                />
              </td>
            </tr>
            <tr>
              <td className="qir-meta-label"></td>
              <td className="qir-meta-value" colSpan={2}></td>
              <td className="qir-meta-label"></td>
              <td className="qir-meta-value" colSpan={2}></td>
              <td className="qir-meta-label">Report No :</td>
              <td className="qir-meta-value">
                <input
                  name="reportNo"
                  value={formData.reportNo}
                  onChange={handleFieldChange}
                  className={errors.reportNo ? 'qir-input-error' : ''}
                  ref={setRef('reportNo')}
                  readOnly={isFromSource}
                  style={isFromSource ? { backgroundColor: '#f9fafb', cursor: 'not-allowed' } : {}}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Observation table toolbar (ABOVE the table) ─────── */}
        <div className="qir-table-toolbar qir-no-print">
          <span className="qir-toolbar-label">Observation</span>
          <div className="qir-toolbar-actions">
            <button type="button" className="qir-add-btn" onClick={addSampleColumn}>
              <FaPlus size={10} /> Sample Column
            </button>
            <button type="button" className="qir-add-btn" onClick={removeSampleColumn} disabled={isViewMode || formData.sampleCount <= 1}>
              <FaTrash size={10} /> Remove Column
            </button>
            <button type="button" className="qir-add-btn" onClick={addParameterRow}>
              <FaPlus size={10} /> Parameter Row
            </button>
          </div>
        </div>

        {/* ── Observation table with observation validation indicator ── */}
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
              {formData.parameters.map((row, rowIndex) => {
                const hasObservation = row.observations.some(obs => obs && obs.trim() !== '');
                const hasObservationError = errors[`observation_${rowIndex}`] && !hasObservation;

                return (
                  <tr key={row.id} className={hasObservationError ? 'qir-row-error' : ''}>
                    <td className="qir-col-sr qir-text-center">{rowIndex + 1}</td>
                    <td className="qir-col-param">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AutocompleteInput
                          value={row.parameter}
                          onChange={(value) => handleParameterNameChange(rowIndex, value)}
                          onSelect={(item) => handleParameterSelect(rowIndex, item)}
                          placeholder="Search parameter..."
                          apiEndpoint="/quality-parameter"
                          displayField="parameter_name"
                          labelField="parameter_code"
                          subLabelField="unit"
                          searchParam="search"
                        />
                        {row.isMandatory === 1 && (
                          <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: 'bold' }} title="Mandatory parameter">*</span>
                        )}
                      </div>
                    </td>
                    <td className="qir-col-spec">
                      <SpecificationInput
                        value={row.specification}
                        onChange={(value) => handleParameterFieldChange(rowIndex, 'specification', value)}
                        placeholder="e.g. 9±0.2"
                      />
                    </td>
                    <td className="qir-col-method">
                      <AutocompleteInput
                        value={row.inspectionMethod}
                        onChange={(value) => handleMethodNameChange(rowIndex, value)}
                        onSelect={(item) => handleMethodSelect(rowIndex, item)}
                        placeholder="Search method..."
                        apiEndpoint="/inspection-method"
                        displayField="method_name"
                        labelField="description"
                        searchParam="search"
                      />
                    </td>
                    {row.observations.map((value, colIndex) => {
                      const outOfSpec = isObservationOutOfSpec(row.specification, value);
                      const isObservationCellError = hasObservationError && !value.trim();
                      return (
                        <td key={colIndex} className="qir-col-obs">
                          <input
                            value={value}
                            onChange={(e) => handleObservationChange(rowIndex, colIndex, e.target.value)}
                            className={
                              outOfSpec ? 'qir-out-of-spec' :
                                isObservationCellError ? 'qir-observation-error' : ''
                            }
                            title={
                              outOfSpec ? 'Reading is outside the specification tolerance' :
                                isObservationCellError ? 'At least one observation value is required' : undefined
                            }
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
                      {hasObservationError && (
                        <div className="qir-error-indicator" title="At least one observation value is required">
                          <FaExclamationTriangle size={10} color="#dc2626" />
                        </div>
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
                  <DatePicker
                    value={formData.footerRevDate}
                    onChange={(value) => handleDateChange('footerRevDate', value)}
                    name="footerRevDate"
                  />
                </div>
              </td>
              <td className="qir-signoff-name">
                <span className="qir-label-inline">Inspected By:</span>
                <AutocompleteInput
                  value={formData.inspectedBy}
                  onChange={handleInspectedByChange}
                  onSelect={handleInspectedBySelect}
                  placeholder="Search employee..."
                  apiEndpoint="/employee"
                  displayField="employee_name"
                  labelField="employee_code"
                  subLabelField="designation"
                  searchParam="search"
                />
              </td>
              <td className="qir-signoff-name">
                <span className="qir-label-inline">Reviewed By:</span>
                <AutocompleteInput
                  value={formData.reviewedBy}
                  onChange={handleReviewedByChange}
                  onSelect={handleReviewedBySelect}
                  placeholder="Search employee..."
                  apiEndpoint="/employee"
                  displayField="employee_name"
                  labelField="employee_code"
                  subLabelField="designation"
                  searchParam="search"
                />
              </td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* ── Popup 1: Template Creation Modal ─────────────────────── */}
      <TemplateCreationModal
        isOpen={showTemplateCreationModal}
        onConfirm={handleCreateTemplate}
        onSkip={handleSkipTemplateCreation}
      />

      {/* ── Popup 2: Template Update Modal ───────────────────────── */}
      <TemplateUpdateModal
        isOpen={showTemplateUpdateModal}
        onConfirm={handleUpdateTemplate}
        onSkip={handleSkipTemplateUpdate}
      />
    </div>
  );
}