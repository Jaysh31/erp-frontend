import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaSave,
  FaEdit,
  FaSpinner,
  FaChevronDown,
} from 'react-icons/fa';
import "./ItemQuickAdd.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface ItemQuickAddProps {
  onClose: () => void;
  onEditFull: (data: QuickAddData) => void;
}

interface QuickAddData {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  hsnSac: string;
  defaultUOM: string;
  maintainStock: boolean;
  isFixedAsset: boolean;
}

interface ItemGroup {
  id: number;
  item_group_name: string;
  parent_item_group: string;
  is_group: number;
}

interface UOM {
  id: number;
  uom_name: string;
  symbol: string | null;
  common_code: string | null;
  category: string;
  enabled: number;
  must_be_whole_number: number;
}

export default function ItemQuickAdd({ onClose, onEditFull }: ItemQuickAddProps) {
  const { theme } = useAdminTheme();
  const [data, setData] = useState<QuickAddData>({
    itemCode: "",
    itemName: "",
    itemGroup: "",
    hsnSac: "",
    defaultUOM: "Nos",
    maintainStock: true,
    isFixedAsset: false,
  });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Dropdown states
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingUoms, setLoadingUoms] = useState(false);
  
  // Dropdown search states
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [uomSearchTerm, setUomSearchTerm] = useState('');
  
  // Dropdown visibility states
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showUomDropdown, setShowUomDropdown] = useState(false);
  
  // Refs for dropdowns
  const groupRef = useRef<HTMLDivElement>(null);
  const uomRef = useRef<HTMLDivElement>(null);

  const set = (field: keyof QuickAddData, value: string | boolean) =>
    setData((prev) => ({ ...prev, [field]: value }));

  // Fetch Item Groups
  const fetchItemGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await api.get('/item-group?page=1&limit=100');
      if (response.data.success === 1) {
        setItemGroups(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching item groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Fetch UOMs
  const fetchUOMs = async () => {
    setLoadingUoms(true);
    try {
      const response = await api.get('/uom?page=1&limit=100');
      if (response.data.success === 1) {
        setUoms(response.data.data.records);
      }
    } catch (err) {
      console.error('Error fetching UOMs:', err);
    } finally {
      setLoadingUoms(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchItemGroups();
    fetchUOMs();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
      if (uomRef.current && !uomRef.current.contains(event.target as Node)) {
        setShowUomDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter item groups based on search term
  const filteredGroups = itemGroups.filter(group => 
    group.item_group_name.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  // Filter UOMs based on search term
  const filteredUoms = uoms.filter(uom => 
    uom.uom_name.toLowerCase().includes(uomSearchTerm.toLowerCase()) ||
    (uom.symbol && uom.symbol.toLowerCase().includes(uomSearchTerm.toLowerCase()))
  );

  const handleSave = async () => {
    // Validate required fields
    if (!data.itemCode.trim()) {
      setApiError('Item Code is required');
      return;
    }
    if (!data.itemGroup.trim()) {
      setApiError('Item Group is required');
      return;
    }
    if (!data.defaultUOM.trim()) {
      setApiError('Default UOM is required');
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      // Prepare payload for API - exactly as specified
      const payload = {
        item_code: data.itemCode.trim(),
        item_name: data.itemName.trim() || data.itemCode.trim(),
        item_group: data.itemGroup.trim(),
        stock_uom: data.defaultUOM.trim(),
        description: data.itemName.trim() || data.itemCode.trim(),
        is_stock_item: data.maintainStock ? 1 : 0,
        is_sales_item: 1,
        is_purchase_item: 1,
        brand: null,
        valuation_method: "FIFO"
      };

      const response = await api.post('/item', payload);
      
      if (response.data && response.data.success === 1) {
        // Success - close modal and pass data to parent
        onEditFull(data);
        onClose();
      } else {
        setApiError(response.data?.message || 'Failed to create item');
      }
    } catch (err: any) {
      console.error('Error creating item:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('An item with this code already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to create item');
        }
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleSave();
    }
  };

  const handleGroupSelect = (groupName: string) => {
    set('itemGroup', groupName);
    setGroupSearchTerm(groupName);
    setShowGroupDropdown(false);
    setApiError(null);
  };

  const handleUomSelect = (uomName: string) => {
    set('defaultUOM', uomName);
    setUomSearchTerm(uomName);
    setShowUomDropdown(false);
    setApiError(null);
  };

  return (
    <div className={`qad-overlay ${theme}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qad-modal">
        {/* Header */}
        <div className="qad-header">
          <div className="qad-header-left">
            <div className="qad-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <span className="qad-title">New Item</span>
          </div>
          <button className="qad-close" onClick={onClose} title="Close">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Error Message */}
        {apiError && (
          <div className="qad-error">
            <span className="qad-error-icon">⚠</span>
            <span className="qad-error-text">{apiError}</span>
            <button className="qad-error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* Body */}
        <div className="qad-body">
          <div className="qad-field">
            <label className="qad-label">
              Item Code <span className="qad-req">*</span>
            </label>
            <input
              className="qad-input"
              value={data.itemCode}
              onChange={(e) => {
                set("itemCode", e.target.value);
                setApiError(null);
              }}
              onKeyPress={handleKeyPress}
              autoFocus
              placeholder="Enter item code"
            />
          </div>

          <div className="qad-field">
            <label className="qad-label">Item Name</label>
            <input
              className="qad-input"
              value={data.itemName}
              onChange={(e) => {
                set("itemName", e.target.value);
                setApiError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter item name"
            />
          </div>

          <div className="qad-field">
            <label className="qad-label">
              Item Group <span className="qad-req">*</span>
            </label>
            <div className="qad-dropdown-container" ref={groupRef}>
              <div className="qad-dropdown-input-wrapper" onClick={() => setShowGroupDropdown(!showGroupDropdown)}>
                <input
                  className={`qad-input qad-dropdown-input ${!data.itemGroup && apiError ? 'qad-input-error' : ''}`}
                  value={groupSearchTerm || data.itemGroup}
                  onChange={(e) => {
                    setGroupSearchTerm(e.target.value);
                    set('itemGroup', '');
                    setShowGroupDropdown(true);
                    setApiError(null);
                  }}
                  onFocus={() => setShowGroupDropdown(true)}
                  placeholder="Search or select item group"
                />
                <FaChevronDown className={`qad-dropdown-icon ${showGroupDropdown ? 'qad-dropdown-icon-open' : ''}`} />
              </div>
              {showGroupDropdown && (
                <div className="qad-dropdown-menu">
                  {loadingGroups ? (
                    <div className="qad-dropdown-loading">
                      <FaSpinner className="spinning" size={14} />
                      Loading groups...
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="qad-dropdown-empty">No groups found</div>
                  ) : (
                    filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className="qad-dropdown-item"
                        onClick={() => handleGroupSelect(group.item_group_name)}
                      >
                        <span className="qad-dropdown-item-text">{group.item_group_name}</span>
                        {group.parent_item_group && (
                          <span className="qad-dropdown-item-sub">{group.parent_item_group}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="qad-field">
            <label className="qad-label">
              HSN/SAC
            </label>
            <div>
              <input
                className="qad-input"
                value={data.hsnSac}
                onChange={(e) => {
                  set("hsnSac", e.target.value);
                  setApiError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter HSN/SAC code"
              />
              <p className="qad-hint">
                You can search code by the description of the category.
              </p>
            </div>
          </div>

          <div className="qad-field">
            <label className="qad-label">
              Default UOM <span className="qad-req">*</span>
            </label>
            <div className="qad-dropdown-container" ref={uomRef}>
              <div className="qad-dropdown-input-wrapper" onClick={() => setShowUomDropdown(!showUomDropdown)}>
                <input
                  className={`qad-input qad-dropdown-input ${!data.defaultUOM && apiError ? 'qad-input-error' : ''}`}
                  value={uomSearchTerm || data.defaultUOM}
                  onChange={(e) => {
                    setUomSearchTerm(e.target.value);
                    set('defaultUOM', '');
                    setShowUomDropdown(true);
                    setApiError(null);
                  }}
                  onFocus={() => setShowUomDropdown(true)}
                  placeholder="Search or select UOM"
                />
                <FaChevronDown className={`qad-dropdown-icon ${showUomDropdown ? 'qad-dropdown-icon-open' : ''}`} />
              </div>
              {showUomDropdown && (
                <div className="qad-dropdown-menu">
                  {loadingUoms ? (
                    <div className="qad-dropdown-loading">
                      <FaSpinner className="spinning" size={14} />
                      Loading UOMs...
                    </div>
                  ) : filteredUoms.length === 0 ? (
                    <div className="qad-dropdown-empty">No UOMs found</div>
                  ) : (
                    filteredUoms.map((uom) => (
                      <div
                        key={uom.id}
                        className="qad-dropdown-item"
                        onClick={() => handleUomSelect(uom.uom_name)}
                      >
                        <span className="qad-dropdown-item-text">{uom.uom_name}</span>
                        {uom.symbol && (
                          <span className="qad-dropdown-item-sub">({uom.symbol})</span>
                        )}
                        {uom.category && (
                          <span className="qad-dropdown-item-category">{uom.category}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="qad-check-field">
            <label className="qad-label">Stock</label>
            <div className="qad-check-content">
              <input
                type="checkbox"
                id="maintainStock"
                className="qad-checkbox"
                checked={data.maintainStock}
                onChange={(e) => set("maintainStock", e.target.checked)}
              />
              <div>
                <label htmlFor="maintainStock" className="qad-check-label">
                  Maintain Stock
                </label>
                <p className="qad-hint">
                  ERPNext will make a stock ledger entry for each transaction of this item.
                  Keep unchecked for non-stock or service items.
                </p>
              </div>
            </div>
          </div>

          <div className="qad-check-field">
            <label className="qad-label">Asset</label>
            <div className="qad-check-content">
              <input
                type="checkbox"
                id="isFixedAsset"
                className="qad-checkbox"
                checked={data.isFixedAsset}
                onChange={(e) => set("isFixedAsset", e.target.checked)}
              />
              <div>
                <label htmlFor="isFixedAsset" className="qad-check-label">
                  Is Fixed Asset
                </label>
                <p className="qad-hint">
                  Enable if this item is a company asset like machinery or furniture.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="qad-footer">
          <button
            className="qad-btn-outline"
            onClick={() => onEditFull(data)}
          >
            <FaEdit size={12} />
            Edit Full Form
          </button>
          <button
            className="qad-btn-save"
            onClick={handleSave}
            disabled={!data.itemCode || !data.itemGroup || saving}
          >
            {saving ? (
              <>
                <FaSpinner className="spinning" size={12} />
                Saving...
              </>
            ) : (
              <>
                <FaSave size={12} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}