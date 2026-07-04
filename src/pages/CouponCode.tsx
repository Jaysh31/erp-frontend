import React, { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash,  FaFilter, 
  FaCheckCircle, FaTimesCircle, FaSave, FaSpinner, FaTimes,
  FaToggleOn, FaToggleOff, FaCopy,
  FaClock,  FaGift, FaExternalLinkAlt, 
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './CouponCode.css';

interface CouponCode {
  id: string;
  couponName: string;
  couponType: string;
  couponCode: string;
  fromExternalEcommPlatform: boolean;
  pricingRule: string;
  validFrom: string;
  validUpto: string;
  maximumUse: number;
  used: number;
  couponDescription: string;
  createdAt: string;
  updatedAt: string;
}

export default function CouponCode() {
  
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
  const [selectedCoupon, setSelectedCoupon] = useState<CouponCode | null>(null);
  const [loading, setLoading] = useState(false);

  const [coupons, setCoupons] = useState<CouponCode[]>([
    {
      id: '1',
      couponName: 'Summer Sale 2026',
      couponType: 'Promotional',
      couponCode: 'SUMMER20',
      fromExternalEcommPlatform: false,
      pricingRule: 'Bulk Discount 10%',
      validFrom: '2026-06-01',
      validUpto: '2026-08-31',
      maximumUse: 100,
      used: 45,
      couponDescription: '20% off on summer collection',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      couponName: 'Festival Offer',
      couponType: 'Promotional',
      couponCode: 'FEST15',
      fromExternalEcommPlatform: false,
      pricingRule: 'Festival Offer',
      validFrom: '2026-06-15',
      validUpto: '2026-07-15',
      maximumUse: 50,
      used: 23,
      couponDescription: '15% discount on festive collection',
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z'
    },
    {
      id: '3',
      couponName: 'New Customer Welcome',
      couponType: 'Promotional',
      couponCode: 'WELCOME10',
      fromExternalEcommPlatform: true,
      pricingRule: 'New Customer Discount',
      validFrom: '2026-06-01',
      validUpto: '2026-12-31',
      maximumUse: 200,
      used: 78,
      couponDescription: '10% off for new customers',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    }
  ]);

  const [formData, setFormData] = useState<CouponCode>({
    id: '',
    couponName: '',
    couponType: 'Promotional',
    couponCode: '',
    fromExternalEcommPlatform: false,
    pricingRule: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUpto: '',
    maximumUse: 0,
    used: 0,
    couponDescription: '',
    createdAt: '',
    updatedAt: ''
  });

  const couponTypes = ['Promotional', 'Gift', 'Discount', 'Seasonal', 'Loyalty', 'Referral'];
  const pricingRules = ['Bulk Discount 10%', 'Festival Offer', 'New Customer Discount', 'Seasonal Sale', 'Loyalty Reward'];

  const filteredCoupons = coupons.filter(c => 
    c.couponName.toLowerCase().includes(filterText.toLowerCase()) ||
    c.couponCode.toLowerCase().includes(filterText.toLowerCase()) ||
    c.couponType.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({
      id: '',
      couponName: '',
      couponType: 'Promotional',
      couponCode: '',
      fromExternalEcommPlatform: false,
      pricingRule: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUpto: '',
      maximumUse: 0,
      used: 0,
      couponDescription: '',
      createdAt: '',
      updatedAt: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (coupon: CouponCode) => {
    setSelectedCoupon(coupon);
    setFormData({ ...coupon });
    setShowEditModal(true);
  };

  const handleDelete = (coupon: CouponCode) => {
    setSelectedCoupon(coupon);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.couponName.trim()) {
      toast.error('Coupon Name is required');
      return;
    }
    if (!formData.couponCode.trim()) {
      toast.error('Coupon Code is required');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (showEditModal && selectedCoupon) {
        setCoupons(prev => prev.map(c => 
          c.id === selectedCoupon.id 
            ? { ...c, ...formData, updatedAt: new Date().toISOString() }
            : c
        ));
        toast.success('Coupon Code updated successfully!');
      } else {
        const newCoupon: CouponCode = {
          ...formData,
          id: String(coupons.length + 1),
          used: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCoupons(prev => [...prev, newCoupon]);
        toast.success('Coupon Code created successfully!');
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to save coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = (coupon: CouponCode) => {
    const newCoupon: CouponCode = {
      ...coupon,
      id: String(coupons.length + 1),
      couponName: `${coupon.couponName} (Copy)`,
      couponCode: `${coupon.couponCode}-COPY`,
      used: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCoupons(prev => [...prev, newCoupon]);
    toast.success('Coupon Code duplicated successfully!');
  };

  const getUsagePercentage = (used: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((used / max) * 100);
  };

  return (
    <div className={`coupon-page ${theme}-theme`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Coupon Code</h1>
          <span className="badge">{coupons.length} Coupons</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Coupon Code
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name, Code or Type..."
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
          <span className="result-count">{filteredCoupons.length} of {coupons.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Coupon Type</label>
            <select>
              <option value="all">All</option>
              {couponTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>External Platform</label>
            <select>
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="exhausted">Exhausted</option>
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Coupon List */}
      <div className="coupon-container">
        {filteredCoupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaGift size={48} />
            </div>
            <h3>You haven't created a Coupon Code yet</h3>
            <p>Create your first Coupon Code</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Coupon Code
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="coupon-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Coupon Name</th>
                  <th>Coupon Code</th>
                  <th>Type</th>
                  <th>Pricing Rule</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const usagePercentage = getUsagePercentage(coupon.used, coupon.maximumUse);
                  const isExpired = coupon.validUpto && new Date(coupon.validUpto) < new Date();
                  const isExhausted = coupon.maximumUse > 0 && coupon.used >= coupon.maximumUse;
                  const status = isExpired ? 'expired' : isExhausted ? 'exhausted' : 'active';
                  
                  return (
                    <tr key={coupon.id} className="coupon-row">
                      <td className="id-cell">{coupon.id}</td>
                      <td className="name-cell">
                        <span className="coupon-name">{coupon.couponName}</span>
                        {coupon.fromExternalEcommPlatform && (
                          <span className="badge-external">
                            <FaExternalLinkAlt size={9} /> External
                          </span>
                        )}
                      </td>
                      <td className="code-cell">
                        <span className="coupon-code">{coupon.couponCode}</span>
                      </td>
                      <td>
                        <span className="type-badge">{coupon.couponType}</span>
                      </td>
                      <td className="rule-cell">{coupon.pricingRule || '-'}</td>
                      <td className="usage-cell">
                        <div className="usage-bar">
                          <div 
                            className="usage-fill" 
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                          <span>{coupon.used} / {coupon.maximumUse || '∞'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status === 'active' && <FaCheckCircle size={10} />}
                          {status === 'expired' && <FaTimesCircle size={10} />}
                          {status === 'exhausted' && <FaClock size={10} />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button 
                            className="action-btn edit" 
                            title="Edit"
                            onClick={() => handleEdit(coupon)}
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="action-btn copy" 
                            title="Duplicate"
                            onClick={() => handleDuplicate(coupon)}
                          >
                            <FaCopy size={12} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Delete"
                            onClick={() => handleDelete(coupon)}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredCoupons.length} of {coupons.length} coupons</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaGift size={11} /> {coupons.filter(c => {
              const isExpired = c.validUpto && new Date(c.validUpto) < new Date();
              const isExhausted = c.maximumUse > 0 && c.used >= c.maximumUse;
              return !isExpired && !isExhausted;
            }).length} active
          </span>
        </div>
      </div>

     {/* ====== CREATE/EDIT MODAL (SCROLLABLE) ====== */}
{(showCreateModal || showEditModal) && (
  <div className="modal-overlay" onClick={() => {
    setShowCreateModal(false);
    setShowEditModal(false);
  }}>
    <div className="modal-container coupon-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{showEditModal ? 'Edit Coupon Code' : 'New Coupon Code'}</h2>
        <button className="modal-close" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}>
          <FaTimes />
        </button>
      </div>
      <div className="modal-body scrollable-body">
        <form onSubmit={handleSubmit}>
          {/* Coupon Details */}
          <div className="form-section">
            <h3 className="section-title">Coupon Details</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Coupon Name *</label>
                <input
                  type="text"
                  value={formData.couponName}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponName: e.target.value }))}
                  placeholder="e.g. Summer Holiday 2019 Offer 20"
                  required
                />
                <span className="field-hint">e.g. "Summer Holiday 2019 Offer 20"</span>
              </div>
              <div className="form-group">
                <label>Coupon Type *</label>
                <select
                  value={formData.couponType}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponType: e.target.value }))}
                  required
                >
                  {couponTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Pricing Rule</label>
                <select
                  value={formData.pricingRule}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricingRule: e.target.value }))}
                >
                  <option value="">Select Pricing Rule</option>
                  {pricingRules.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  placeholder="Unique e.g. SAVE20"
                  required
                />
                <span className="field-hint">unique e.g. SAVE20 To be used to get discount</span>
              </div>
              <div className="form-group full-width">
                <label>From External Ecomm Platform</label>
                <button
                  type="button"
                  className={`toggle-switch ${formData.fromExternalEcommPlatform ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, fromExternalEcommPlatform: !prev.fromExternalEcommPlatform }))}
                >
                  {formData.fromExternalEcommPlatform ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                  <span>{formData.fromExternalEcommPlatform ? 'Yes' : 'No'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validity and Usage */}
          <div className="form-section">
            <h3 className="section-title">Validity and Usage</h3>
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
              <div className="form-group">
                <label>Maximum Use</label>
                <input
                  type="number"
                  value={formData.maximumUse}
                  onChange={(e) => setFormData(prev => ({ ...prev, maximumUse: Number(e.target.value) }))}
                  min="0"
                  placeholder="0 = Unlimited"
                />
              </div>
              <div className="form-group">
                <label>Used</label>
                <input
                  type="number"
                  value={formData.used}
                  onChange={(e) => setFormData(prev => ({ ...prev, used: Number(e.target.value) }))}
                  min="0"
                  disabled={!showEditModal}
                  className={!showEditModal ? 'disabled-input' : ''}
                />
                <span className="field-hint">Auto-increments on usage</span>
              </div>
            </div>
          </div>

          {/* Coupon Description */}
          <div className="form-section">
            <h3 className="section-title">Coupon Description</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.couponDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponDescription: e.target.value }))}
                  placeholder="Enter coupon description..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Usage Summary (Edit mode only) */}
          {showEditModal && selectedCoupon && (
            <div className="form-section summary-section">
              <h3 className="section-title">Usage Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Total Used</span>
                  <strong>{selectedCoupon.used}</strong>
                </div>
                <div className="summary-item">
                  <span>Maximum Use</span>
                  <strong>{selectedCoupon.maximumUse || 'Unlimited'}</strong>
                </div>
                <div className="summary-item">
                  <span>Remaining</span>
                  <strong>
                    {selectedCoupon.maximumUse > 0 
                      ? selectedCoupon.maximumUse - selectedCoupon.used 
                      : '∞'}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>Usage Rate</span>
                  <strong>
                    {selectedCoupon.maximumUse > 0 
                      ? `${Math.round((selectedCoupon.used / selectedCoupon.maximumUse) * 100)}%`
                      : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>
          )}

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
      {showDeleteModal && selectedCoupon && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Coupon Code</h2>
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
                You are about to delete <strong>{selectedCoupon.couponName}</strong>
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
                  setCoupons(prev => prev.filter(c => c.id !== selectedCoupon.id));
                  setShowDeleteModal(false);
                  toast.success('Coupon Code deleted successfully!');
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