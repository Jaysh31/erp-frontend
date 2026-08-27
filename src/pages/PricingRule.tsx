import React, { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash,  FaFilter, 
  FaSave, FaSpinner, FaTimes,
   FaToggleOn, FaToggleOff, FaCopy,
   FaTag
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './PricingRule.css';

interface PricingRuleItem {
  id: string;
  itemCode: string;
  uom: string;
}

interface PricingRule {
  id: string;
  namingSeries: string;
  title: string;
  disable: boolean;
  applyOn: string;
  priceOrProductDiscount: string;
  warehouse: string;
  items: PricingRuleItem[];
  mixedConditions: boolean;
  isCumulative: boolean;
  couponCodeBased: boolean;
  discountOnOtherItem: boolean;
  selling: boolean;
  buying: boolean;
  minQty: number;
  maxQty: number;
  minAmt: number;
  maxAmt: number;
  validFrom: string;
  validUpto: string;
  company: string;
  currency: string;
  marginType: string;
  marginRateOrAmount: number;
  rateOrDiscount: string;
  discountPercentage: number;
  forPriceList: string;
  createdAt: string;
  updatedAt: string;
}

export default function PricingRule() {
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPricingRule, setSelectedPricingRule] = useState<PricingRule | null>(null);
  const [loading, setLoading] = useState(false);

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      id: '1',
      namingSeries: 'PRLE-0001',
      title: 'Bulk Discount 10%',
      disable: false,
      applyOn: 'Item Code',
      priceOrProductDiscount: 'Price',
      warehouse: 'Main Warehouse',
      items: [
        { id: '1', itemCode: 'ITEM-001', uom: 'PCS' },
        { id: '2', itemCode: 'ITEM-002', uom: 'KG' }
      ],
      mixedConditions: false,
      isCumulative: false,
      couponCodeBased: false,
      discountOnOtherItem: false,
      selling: true,
      buying: false,
      minQty: 10,
      maxQty: 100,
      minAmt: 1000,
      maxAmt: 10000,
      validFrom: '2026-01-01',
      validUpto: '2026-12-31',
      company: 'Test Company',
      currency: 'INR',
      marginType: 'Percentage',
      marginRateOrAmount: 10,
      rateOrDiscount: 'Discount Percentage',
      discountPercentage: 10,
      forPriceList: 'Standard Selling',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      namingSeries: 'PRLE-0002',
      title: 'Festival Offer',
      disable: false,
      applyOn: 'Item Group',
      priceOrProductDiscount: 'Product Discount',
      warehouse: 'Main Warehouse',
      items: [
        { id: '1', itemCode: 'ITEM-GRP-001', uom: 'NOS' }
      ],
      mixedConditions: true,
      isCumulative: false,
      couponCodeBased: true,
      discountOnOtherItem: false,
      selling: true,
      buying: false,
      minQty: 5,
      maxQty: 50,
      minAmt: 500,
      maxAmt: 5000,
      validFrom: '2026-06-01',
      validUpto: '2026-06-30',
      company: 'Test Company',
      currency: 'INR',
      marginType: 'Amount',
      marginRateOrAmount: 500,
      rateOrDiscount: 'Discount Percentage',
      discountPercentage: 15,
      forPriceList: 'Retail',
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z'
    }
  ]);

  const [formData, setFormData] = useState<PricingRule>({
    id: '',
    namingSeries: 'PRLE-####',
    title: '',
    disable: false,
    applyOn: 'Item Code',
    priceOrProductDiscount: 'Price',
    warehouse: '',
    items: [{ id: '1', itemCode: '', uom: 'PCS' }],
    mixedConditions: false,
    isCumulative: false,
    couponCodeBased: false,
    discountOnOtherItem: false,
    selling: true,
    buying: false,
    minQty: 0,
    maxQty: 0,
    minAmt: 0,
    maxAmt: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUpto: '',
    company: '',
    currency: 'INR',
    marginType: 'Percentage',
    marginRateOrAmount: 0,
    rateOrDiscount: 'Discount Percentage',
    discountPercentage: 0,
    forPriceList: '',
    createdAt: '',
    updatedAt: ''
  });

  const applyOnOptions = ['Item Code', 'Item Group', 'Brand', 'Category'];
  const priceOrProductOptions = ['Price', 'Product Discount'];
  const marginTypeOptions = ['Percentage', 'Amount'];
  const rateOrDiscountOptions = ['Discount Percentage', 'Discount Amount', 'Flat Rate'];
  const uomOptions = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'NOS', 'SQM', 'CBM'];
  const warehouses = ['Main Warehouse', 'Secondary Warehouse', 'Store 1', 'Store 2'];
  const companies = ['Test Company', 'Main Company', 'Subsidiary'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const priceLists = ['Standard Selling', 'Wholesale', 'Retail', 'Export Pricing', 'Distributor'];

  const filteredPricingRules = pricingRules.filter(pr => 
    pr.title.toLowerCase().includes(filterText.toLowerCase()) ||
    pr.applyOn.toLowerCase().includes(filterText.toLowerCase()) ||
    pr.namingSeries.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({
      id: '',
      namingSeries: `PRLE-${String(pricingRules.length + 1).padStart(4, '0')}`,
      title: '',
      disable: false,
      applyOn: 'Item Code',
      priceOrProductDiscount: 'Price',
      warehouse: '',
      items: [{ id: '1', itemCode: '', uom: 'PCS' }],
      mixedConditions: false,
      isCumulative: false,
      couponCodeBased: false,
      discountOnOtherItem: false,
      selling: true,
      buying: false,
      minQty: 0,
      maxQty: 0,
      minAmt: 0,
      maxAmt: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUpto: '',
      company: '',
      currency: 'INR',
      marginType: 'Percentage',
      marginRateOrAmount: 0,
      rateOrDiscount: 'Discount Percentage',
      discountPercentage: 0,
      forPriceList: '',
      createdAt: '',
      updatedAt: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (pricingRule: PricingRule) => {
    setSelectedPricingRule(pricingRule);
    setFormData({ ...pricingRule });
    setShowEditModal(true);
  };

  const handleDelete = (pricingRule: PricingRule) => {
    setSelectedPricingRule(pricingRule);
    setShowDeleteModal(true);
  };

  const handleItemChange = (index: number, field: keyof PricingRuleItem, value: string) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, itemCode: '', uom: 'PCS' }]
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (showEditModal && selectedPricingRule) {
        setPricingRules(prev => prev.map(pr => 
          pr.id === selectedPricingRule.id 
            ? { ...pr, ...formData, updatedAt: new Date().toISOString() }
            : pr
        ));
        toast.success('Pricing Rule updated successfully!');
      } else {
        const newPricingRule: PricingRule = {
          ...formData,
          id: String(pricingRules.length + 1),
          namingSeries: `PRLE-${String(pricingRules.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPricingRules(prev => [...prev, newPricingRule]);
        toast.success('Pricing Rule created successfully!');
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to save pricing rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pricing-rule-page ${theme}-theme`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Pricing Rule</h1>
          <span className="badge">{pricingRules.length} Rules</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Pricing Rule
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Title or Apply On..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {filterText && (
            <button className="clear-btn" onClick={() => setFilterText('')}>×</button>
          )}
        </div>
        <div className="filter-wrapper">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredPricingRules.length} of {pricingRules.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Apply On</label>
            <select>
              <option value="all">All</option>
              {applyOnOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select>
              <option value="all">All</option>
              <option value="selling">Selling</option>
              <option value="buying">Buying</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Pricing Rules List */}
      <div className="pricing-rule-container">
        {filteredPricingRules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaTag size={48} />
            </div>
            <h3>You haven't created a Pricing Rule yet</h3>
            <p>Create your first Pricing Rule</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Pricing Rule
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="pricing-rule-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Apply On</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Valid Till</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPricingRules.map((pr) => (
                  <tr key={pr.id} className="pricing-rule-row">
                    <td className="id-cell">{pr.namingSeries}</td>
                    <td className="title-cell">
                      <span className="rule-title">{pr.title}</span>
                      {pr.mixedConditions && (
                        <span className="badge-mixed">Mixed</span>
                      )}
                      {pr.couponCodeBased && (
                        <span className="badge-coupon">Coupon</span>
                      )}
                    </td>
                    <td className="apply-cell">
                      <span className="apply-badge">{pr.applyOn}</span>
                    </td>
                    <td className="type-cell">
                      <div className="type-badges">
                        {pr.selling && <span className="type-badge selling">Selling</span>}
                        {pr.buying && <span className="type-badge buying">Buying</span>}
                      </div>
                    </td>
                    <td className="discount-cell">
                      <span className="discount-value">
                        {pr.discountPercentage > 0 ? `${pr.discountPercentage}%` : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${pr.disable ? 'disabled' : 'active'}`}>
                        {pr.disable ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="valid-cell">
                      {pr.validUpto ? new Date(pr.validUpto).toLocaleDateString() : '∞'}
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(pr)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => {
                            const newRule: PricingRule = {
                              ...pr,
                              id: String(pricingRules.length + 1),
                              namingSeries: `PRLE-${String(pricingRules.length + 1).padStart(4, '0')}`,
                              title: `${pr.title} (Copy)`,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            };
                            setPricingRules(prev => [...prev, newRule]);
                            toast.success('Pricing Rule duplicated successfully!');
                          }}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(pr)}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredPricingRules.length} of {pricingRules.length} pricing rules</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaTag size={11} /> {pricingRules.filter(pr => !pr.disable).length} active
          </span>
        </div>
      </div>

      {/* ====== CREATE/EDIT MODAL ====== */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}>
          <div className="modal-container pricing-rule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Pricing Rule' : 'New Pricing Rule'}</h2>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body scrollable-body">
              <form onSubmit={handleSubmit}>
                {/* Naming Series & Title */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Naming Series</label>
                      <input
                        type="text"
                        value={formData.namingSeries}
                        onChange={(e) => setFormData(prev => ({ ...prev, namingSeries: e.target.value }))}
                        placeholder="PRLE-####"
                      />
                    </div>
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter title"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Disable & Apply On */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Disable</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.disable ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, disable: !prev.disable }))}
                      >
                        {formData.disable ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.disable ? 'Disabled' : 'Enabled'}</span>
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Apply On</label>
                      <select
                        value={formData.applyOn}
                        onChange={(e) => setFormData(prev => ({ ...prev, applyOn: e.target.value }))}
                      >
                        {applyOnOptions.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Price or Product Discount & Warehouse */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Price or Product Discount</label>
                      <select
                        value={formData.priceOrProductDiscount}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceOrProductDiscount: e.target.value }))}
                      >
                        {priceOrProductOptions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Warehouse</label>
                      <select
                        value={formData.warehouse}
                        onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="form-section">
                  <div className="items-header">
                    <label>Apply Rule On Item Code</label>
                    <button type="button" className="add-item-btn" onClick={addItemRow}>
                      <FaPlus size={11} /> Add row
                    </button>
                  </div>
                  <div className="items-table-wrapper">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60%' }}>Item Code</th>
                          <th style={{ width: '35%' }}>UOM</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                type="text"
                                value={item.itemCode}
                                onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                                placeholder="Item code"
                              />
                            </td>
                            <td>
                              <select
                                value={item.uom}
                                onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                              >
                                {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </td>
                            <td>
                              {formData.items.length > 1 && (
                                <button
                                  type="button"
                                  className="remove-item-btn"
                                  onClick={() => removeItemRow(index)}
                                >
                                  <FaTrash size={11} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mixed Conditions & Others */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Mixed Conditions</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.mixedConditions ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, mixedConditions: !prev.mixedConditions }))}
                      >
                        {formData.mixedConditions ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.mixedConditions ? 'Yes' : 'No'}</span>
                      </button>
                      <span className="field-hint">Conditions will be applied on all the selected items combined.</span>
                    </div>
                    <div className="form-group">
                      <label>Is Cumulative</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.isCumulative ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, isCumulative: !prev.isCumulative }))}
                      >
                        {formData.isCumulative ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.isCumulative ? 'Yes' : 'No'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Coupon Code Based & Discount on Other Item */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Coupon Code Based</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.couponCodeBased ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, couponCodeBased: !prev.couponCodeBased }))}
                      >
                        {formData.couponCodeBased ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.couponCodeBased ? 'Yes' : 'No'}</span>
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Discount on Other Item</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.discountOnOtherItem ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, discountOnOtherItem: !prev.discountOnOtherItem }))}
                      >
                        {formData.discountOnOtherItem ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.discountOnOtherItem ? 'Yes' : 'No'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Party Information */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Selling</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.selling ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, selling: !prev.selling }))}
                      >
                        {formData.selling ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.selling ? 'Yes' : 'No'}</span>
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Buying</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.buying ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, buying: !prev.buying }))}
                      >
                        {formData.buying ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.buying ? 'Yes' : 'No'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quantity and Amount */}
                <div className="form-section">
                  <h3 className="section-title">Quantity and Amount</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Min Qty (As Per Stock UOM)</label>
                      <input
                        type="number"
                        value={formData.minQty}
                        onChange={(e) => setFormData(prev => ({ ...prev, minQty: Number(e.target.value) }))}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Qty (As Per Stock UOM)</label>
                      <input
                        type="number"
                        value={formData.maxQty}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxQty: Number(e.target.value) }))}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Min Amt</label>
                      <input
                        type="number"
                        value={formData.minAmt}
                        onChange={(e) => setFormData(prev => ({ ...prev, minAmt: Number(e.target.value) }))}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Amt</label>
                      <input
                        type="number"
                        value={formData.maxAmt}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxAmt: Number(e.target.value) }))}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Period Settings */}
                <div className="form-section">
                  <h3 className="section-title">Period Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Valid From</label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Valid Up To</label>
                      <input
                        type="date"
                        value={formData.validUpto}
                        onChange={(e) => setFormData(prev => ({ ...prev, validUpto: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Company & Currency */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Company</label>
                      <select
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      >
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Margin */}
                <div className="form-section">
                  <h3 className="section-title">Margin</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Margin Type</label>
                      <select
                        value={formData.marginType}
                        onChange={(e) => setFormData(prev => ({ ...prev, marginType: e.target.value }))}
                      >
                        {marginTypeOptions.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Margin Rate or Amount</label>
                      <input
                        type="number"
                        value={formData.marginRateOrAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, marginRateOrAmount: Number(e.target.value) }))}
                        min="0"
                        step="0.001"
                        placeholder="0.000"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Discount Scheme */}
                <div className="form-section">
                  <h3 className="section-title">Price Discount Scheme</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Rate or Discount</label>
                      <select
                        value={formData.rateOrDiscount}
                        onChange={(e) => setFormData(prev => ({ ...prev, rateOrDiscount: e.target.value }))}
                      >
                        {rateOrDiscountOptions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Discount Percentage</label>
                      <input
                        type="number"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>For Price List</label>
                      <select
                        value={formData.forPriceList}
                        onChange={(e) => setFormData(prev => ({ ...prev, forPriceList: e.target.value }))}
                      >
                        <option value="">Select Price List</option>
                        {priceLists.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading && <FaSpinner className="spinning" />}
                    <FaSave size={12} /> {showEditModal ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedPricingRule && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Pricing Rule</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <div className="delete-icon">
                <FaTrash size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                You are about to delete <strong>{selectedPricingRule.title}</strong>
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={() => {
                  setPricingRules(prev => prev.filter(pr => pr.id !== selectedPricingRule.id));
                  setShowDeleteModal(false);
                  toast.success('Pricing Rule deleted successfully!');
                }}
              >
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}