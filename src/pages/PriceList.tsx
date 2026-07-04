import React, { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash,  FaFilter, 
  FaCheckCircle, FaTimesCircle, FaSave, FaSpinner, FaTimes,
  FaToggleOn, FaToggleOff, FaCopy, FaList, FaDollarSign
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './PriceList.css';

interface PriceList {
  id: string;
  name: string;
  currency: string;
  enabled: boolean;
  buying: boolean;
  selling: boolean;
  priceNotUOMDependent: boolean;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export default function PriceList() {
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [loading, setLoading] = useState(false);

  const [priceLists, setPriceLists] = useState<PriceList[]>([
    {
      id: '1',
      name: 'Standard Selling',
      currency: 'INR',
      enabled: true,
      buying: false,
      selling: true,
      priceNotUOMDependent: true,
      country: 'India',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      name: 'Export Pricing',
      currency: 'USD',
      enabled: true,
      buying: false,
      selling: true,
      priceNotUOMDependent: true,
      country: 'United States',
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z'
    },
    {
      id: '3',
      name: 'Wholesale Buying',
      currency: 'INR',
      enabled: false,
      buying: true,
      selling: false,
      priceNotUOMDependent: false,
      country: 'India',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    },
    {
      id: '4',
      name: 'Retail Standard',
      currency: 'EUR',
      enabled: true,
      buying: false,
      selling: true,
      priceNotUOMDependent: true,
      country: 'Germany',
      createdAt: '2026-06-17T10:00:00Z',
      updatedAt: '2026-06-17T10:00:00Z'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    currency: 'INR',
    enabled: true,
    buying: false,
    selling: true,
    priceNotUOMDependent: true,
    country: ''
  });

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD'];
  const countries = [
    'India', 'United States', 'United Kingdom', 'Germany', 'France',
    'Japan', 'Canada', 'Australia', 'UAE', 'Singapore', 'China', 'Brazil'
  ];

  const filteredPriceLists = priceLists.filter(pl => 
    pl.name.toLowerCase().includes(filterText.toLowerCase()) ||
    pl.currency.toLowerCase().includes(filterText.toLowerCase()) ||
    pl.country.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({
      name: '',
      currency: 'INR',
      enabled: true,
      buying: false,
      selling: true,
      priceNotUOMDependent: true,
      country: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (priceList: PriceList) => {
    setSelectedPriceList(priceList);
    setFormData({
      name: priceList.name,
      currency: priceList.currency,
      enabled: priceList.enabled,
      buying: priceList.buying,
      selling: priceList.selling,
      priceNotUOMDependent: priceList.priceNotUOMDependent,
      country: priceList.country
    });
    setShowEditModal(true);
  };

  const handleDelete = (priceList: PriceList) => {
    setSelectedPriceList(priceList);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Price List Name is required');
      return;
    }
    if (!formData.country.trim()) {
      toast.error('Country is required');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (showEditModal && selectedPriceList) {
        setPriceLists(prev => prev.map(pl => 
          pl.id === selectedPriceList.id 
            ? { ...pl, ...formData, updatedAt: new Date().toISOString() }
            : pl
        ));
        toast.success('Price List updated successfully!');
      } else {
        const newPriceList: PriceList = {
          id: String(priceLists.length + 1),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPriceLists(prev => [...prev, newPriceList]);
        toast.success('Price List created successfully!');
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to save price list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = (id: string) => {
    setPriceLists(prev => prev.map(pl => 
      pl.id === id ? { ...pl, enabled: !pl.enabled } : pl
    ));
    const pl = priceLists.find(p => p.id === id);
    toast.success(`${pl?.name} ${pl?.enabled ? 'disabled' : 'enabled'}`);
  };

  const handleDuplicate = (priceList: PriceList) => {
    const newPriceList: PriceList = {
      ...priceList,
      id: String(priceLists.length + 1),
      name: `${priceList.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPriceLists(prev => [...prev, newPriceList]);
    toast.success('Price List duplicated successfully!');
  };

  return (
    <div className={`price-list-page ${theme}-theme`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Price List</h1>
          <span className="badge">{priceLists.length} Lists</span>
        </div>
        <div className="header-actions">
          <button 
            className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <FaList size={14} />
          </button>
          <button 
            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <FaDollarSign size={14} />
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Price List
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search price lists..."
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
          <span className="result-count">{filteredPriceLists.length} of {priceLists.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Status</label>
            <select>
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
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
            <label>Currency</label>
            <select>
              <option value="all">All</option>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Price List Container */}
      <div className="price-list-container">
        {filteredPriceLists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaDollarSign size={48} />
            </div>
            <h3>No price lists found</h3>
            <p>Create your first price list to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Price List
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="table-wrapper">
            <table className="price-list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Price List Name</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Buying</th>
                  <th>Selling</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPriceLists.map((pl) => (
                  <tr key={pl.id} className="price-list-row">
                    <td className="id-cell">{pl.id}</td>
                    <td className="name-cell">
                      <span className="pl-name">{pl.name}</span>
                      {pl.priceNotUOMDependent && (
                        <span className="badge-uom">Not UOM Dependent</span>
                      )}
                    </td>
                    <td className="currency-cell">{pl.currency}</td>
                    <td>
                      <button 
                        className={`status-toggle ${pl.enabled ? 'enabled' : 'disabled'}`}
                        onClick={() => handleToggleEnable(pl.id)}
                      >
                        {pl.enabled ? (
                          <><FaCheckCircle size={12} /> Enabled</>
                        ) : (
                          <><FaTimesCircle size={12} /> Disabled</>
                        )}
                      </button>
                    </td>
                    <td className="type-cell">
                      {pl.buying ? (
                        <span className="type-badge buying">Buying</span>
                      ) : (
                        <span className="type-badge inactive">-</span>
                      )}
                    </td>
                    <td className="type-cell">
                      {pl.selling ? (
                        <span className="type-badge selling">Selling</span>
                      ) : (
                        <span className="type-badge inactive">-</span>
                      )}
                    </td>
                    <td className="country-cell">{pl.country}</td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(pl)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => handleDuplicate(pl)}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(pl)}
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
        ) : (
          <div className="grid-view">
            {filteredPriceLists.map((pl) => (
              <div key={pl.id} className="price-list-card">
                <div className="card-header">
                  <span className={`status-dot ${pl.enabled ? 'enabled' : 'disabled'}`} />
                  <div className="card-actions">
                    <button onClick={() => handleEdit(pl)}><FaEdit size={12} /></button>
                    <button onClick={() => handleDuplicate(pl)}><FaCopy size={12} /></button>
                    <button onClick={() => handleDelete(pl)}><FaTrash size={12} /></button>
                  </div>
                </div>
                <div className="card-body">
                  <h4>{pl.name}</h4>
                  <div className="card-details">
                    <span><strong>Currency:</strong> {pl.currency}</span>
                    <span><strong>Country:</strong> {pl.country}</span>
                    <span><strong>Status:</strong> {pl.enabled ? 'Enabled' : 'Disabled'}</span>
                    <span><strong>Type:</strong> {pl.buying ? 'Buying' : ''} {pl.selling ? 'Selling' : ''}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="badge-uom">Not UOM Dependent</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredPriceLists.length} of {priceLists.length} price lists</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaDollarSign size={11} /> {priceLists.filter(p => p.enabled).length} active
          </span>
        </div>
      </div>

      {/* ====== CREATE/EDIT MODAL (SCROLLABLE) ====== */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}>
          <div className="modal-container create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Price List' : 'Add Price List'}</h2>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body scrollable-body">
              <form onSubmit={handleSubmit}>
                {/* Status */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Enabled</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.enabled ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                      >
                        {formData.enabled ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price List Name */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Price List Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter price list name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Currency & Country */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency *</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        required
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Country *</label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        required
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buying & Selling */}
                <div className="form-section">
                  <div className="form-grid">
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
                    <div className="form-group full-width">
                      <label>Price Not UOM Dependent</label>
                      <button
                        type="button"
                        className={`toggle-switch ${formData.priceNotUOMDependent ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, priceNotUOMDependent: !prev.priceNotUOMDependent }))}
                      >
                        {formData.priceNotUOMDependent ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                        <span>{formData.priceNotUOMDependent ? 'Yes' : 'No'}</span>
                      </button>
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
      {showDeleteModal && selectedPriceList && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Price List</h2>
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
                You are about to delete <strong>{selectedPriceList.name}</strong>.
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
                  setPriceLists(prev => prev.filter(pl => pl.id !== selectedPriceList.id));
                  setShowDeleteModal(false);
                  toast.success('Price List deleted successfully!');
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