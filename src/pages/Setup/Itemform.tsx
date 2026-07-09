import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaTag,
  FaCube,
  FaDollarSign,
  FaEdit,
  FaCheck,
  FaImage,
  FaUpload,
  FaTimes,
} from 'react-icons/fa';
import "./ItemForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import toast from "react-hot-toast";
import api from '../../services/api';

interface ItemData {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset: number;
  is_sales_item: number;
  is_purchase_item: number;
  disabled: number;
  description: string;
  brand: string | null;
  valuation_method: string;
  creation: string;
  modified: string;
  standard_rate: number;
  valuation_rate: number;
  opening_stock: number;
  weight_per_unit: number;
  weight_uom: string | null;
  min_order_qty: number;
  safety_stock: number;
  lead_time_days: number;
  last_purchase_rate: number;
  max_discount: number;
  purchase_uom: string | null;
  sales_uom: string | null;
  country_of_origin: string | null;
  default_material_request_type: string;
  inspection_required_before_purchase: number;
  inspection_required_before_delivery: number;
  quality_inspection_template: string | null;
  image: string | null;
}

interface ItemGroup {
  id: number;
  item_group_name: string;
  parent_item_group: string;
  is_group: number;
  image: string | null;
  creation: string;
  modified: string;
}

interface UOM {
  id: number;
  uom_name: string;
  symbol: string;
  common_code: string;
  category: string;
  enabled: number;
  must_be_whole_number: number;
  creation: string;
}

/* ── Shared Components ─────────────────────────── */

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h3 className="itf-section-title">
      {icon && <span className="itf-section-icon">{icon}</span>}
      {children}
    </h3>
  );
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="itf-field">
      <label className="itf-label">
        {label} {required && <span className="itf-req">*</span>}
      </label>
      {children}
      {hint && <p className="itf-hint">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      className="itf-input"
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder ?? ""}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  loading = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  loading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="itf-select-container" ref={dropdownRef}>
      <div className="itf-select-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input
          ref={inputRef}
          type="text"
          className="itf-select-input"
          value={isOpen ? searchTerm : (selectedOption?.label || "")}
          onChange={(e) => {
            if (isOpen) {
              setSearchTerm(e.target.value);
            }
          }}
          placeholder={selectedOption?.label || placeholder}
          onFocus={() => setIsOpen(true)}
          readOnly={!isOpen}
        />
        <span className="itf-select-arrow">
          {loading ? (
            <FaSpinner className="spinning" size={12} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </div>

      {isOpen && (
        <div className="itf-select-dropdown">
          {loading ? (
            <div className="itf-select-loading">
              <FaSpinner className="spinning" size={16} />
              <span>Loading...</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="itf-select-empty">No options found</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`itf-select-option ${opt.value === value ? 'itf-select-option-selected' : ''}`}
                onClick={() => {
                  onChange?.(opt.value);
                  setSearchTerm("");
                  setIsOpen(false);
                }}
              >
                {opt.label}
                {opt.value === value && <FaCheck className="itf-select-check" size={12} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Image Upload Component ───────────────────────────
function ImageUpload({
  image,
  onImageChange,
  onImageRemove,
  uploading,
}: {
  image: string | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  uploading?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Image size should be less than 2MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    onImageChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="itf-image-upload-container">
      {image ? (
        <div className="itf-image-preview-wrapper">
          <div className="itf-image-preview">
            <img 
              src={image} 
              alt="Item" 
              className="itf-image-preview-img"
            />
          </div>
          <div className="itf-image-actions">
            <button
              type="button"
              className="itf-image-btn itf-image-btn-change"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <FaUpload size={12} /> Change
            </button>
            <button
              type="button"
              className="itf-image-btn itf-image-btn-remove"
              onClick={onImageRemove}
              disabled={uploading}
            >
              <FaTimes size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`itf-image-dropzone ${dragOver ? 'itf-image-dropzone-drag' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="itf-image-dropzone-content">
            {uploading ? (
              <>
                <FaSpinner className="spinning" size={32} />
                <p>Uploading...</p>
              </>
            ) : (
              <>
                <FaImage size={32} className="itf-image-icon" />
                <p className="itf-image-dropzone-text">
                  <span className="itf-image-dropzone-bold">Click to upload</span> or drag and drop
                </p>
                <p className="itf-image-dropzone-hint">
                  PNG, JPG, GIF up to 2MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          e.target.value = ''; // Reset input
        }}
        className="itf-image-file-input"
      />
    </div>
  );
}

/* ── Main Component ─────────────────────────── */

export default function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();
  
  const isNew = id === "new" || !id;
  const itemId = isNew ? null : parseInt(id || "0");
  
  const [loading, setLoading] = useState(false);
  const [, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ field: string; label: string; message: string }[]>([]);

  // Form state
  const [form, setFormRaw] = useState({
    id: 0,
    itemName: "",
    itemCode: "",
    itemGroup: "",
    defaultUOM: "Nos",
    brand: "",
    description: "",
    disabled: false,
    purchaseRate: "0.00",
    mrp: "0.00",
    image: null as string | null, // Image URL from server or base64 preview
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const setForm = (f: any) => { setFormRaw(f); setIsDirty(true); };
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });

  // Data fetching
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loadingUoms, setLoadingUoms] = useState(false);

  // Image compression helper
  const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch item groups
      setLoadingGroups(true);
      try {
        const response = await api.get("/item-group");
        if (response.data.success === 1) {
          setItemGroups(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching item groups:', err);
      } finally {
        setLoadingGroups(false);
      }

      // Fetch UOMs
      setLoadingUoms(true);
      try {
        const response = await api.get("/uom");
        if (response.data.success === 1) {
          setUoms(response.data.data.records || []);
        }
      } catch (err) {
        console.error('Error fetching UOMs:', err);
      } finally {
        setLoadingUoms(false);
      }
    };

    fetchData();
  }, []);

  // Fetch item data
  const fetchItemData = async () => {
    if (!itemId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/item/${itemId}`);
      
      if (response.data.success === 1) {
        const data = response.data.data;
        
        setFormRaw({
          id: data.id || 0,
          itemName: data.item_name || "",
          itemCode: data.item_code || "",
          itemGroup: data.item_group || "",
          defaultUOM: data.stock_uom || "Nos",
          brand: data.brand || "",
          description: data.description || "",
          disabled: data.disabled === 1,
          purchaseRate: String(data.standard_rate || 0),
          mrp: String(data.valuation_rate || 0),
          image: data.image || null,
        });
        setImageFile(null);
        setIsDirty(false);
      } else {
        toast.error('Failed to load item data');
      }
    } catch (err) {
      console.error('Error fetching item:', err);
      toast.error('Failed to load item data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch item data on mount
  useEffect(() => {
    if (!isNew && itemId) {
      fetchItemData();
    }
  }, [isNew, itemId]);

  // Get options
  const groupOptions = itemGroups.map(group => ({
    label: group.item_group_name,
    value: group.item_group_name
  }));

  const uomOptions = uoms
    .filter(uom => uom.enabled === 1)
    .map(uom => ({
      label: uom.uom_name + (uom.symbol ? ` (${uom.symbol})` : ''),
      value: uom.uom_name
    }));

  // Validation
  const getValidationErrors = () => {
    const errors: { field: string; label: string; message: string }[] = [];

    if (!form.itemName.trim())
      errors.push({ field: 'itemName', label: 'Item Name', message: 'Item name is required' });
    if (!form.itemGroup.trim())
      errors.push({ field: 'itemGroup', label: 'Item Group', message: 'Item group is required' });
    if (!form.defaultUOM.trim())
      errors.push({ field: 'defaultUOM', label: 'Default UOM', message: 'Default unit of measure is required' });

    return errors;
  };

  // Handle image upload
  const handleImageChange = async (file: File) => {
    setUploadingImage(true);
    try {
      // Compress the image for preview
      const compressedImage = await compressImage(file, 600, 600, 0.6);
      setForm({ ...form, image: compressedImage });
      setImageFile(file);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to process image');
      console.error('Image processing error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setForm({ ...form, image: null });
    setImageFile(null);
    toast.success('Image removed');
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = getValidationErrors();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let imagePath = form.image;

      // Upload image separately if there's a new file
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        uploadFormData.append('type', 'item');
        
        try {
          const uploadResponse = await api.post('/upload', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (uploadResponse.data.success === 1) {
            imagePath = uploadResponse.data.data.path || uploadResponse.data.data.url;
            // Update form with the uploaded image path
            setForm({ ...form, image: imagePath });
          } else {
            toast.error('Failed to upload image');
            setSubmitting(false);
            return;
          }
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          if (uploadError.response?.status === 413) {
            toast.error('Image file is too large. Please use a smaller image (max 2MB).');
          } else {
            toast.error('Failed to upload image');
          }
          setSubmitting(false);
          return;
        }
      }

      // Save the item with the image path
      const payload = {
        id: parseInt(id || "0"),
        item_code: form.itemCode || form.itemName.toUpperCase().replace(/\s+/g, '-'),
        item_name: form.itemName.trim(),
        item_group: form.itemGroup.trim(),
        stock_uom: form.defaultUOM.trim(),
        description: form.description || form.itemName.trim(),
        brand: form.brand || null,
        disabled: form.disabled ? 1 : 0,
        standard_rate: parseFloat(form.purchaseRate) || 0,
        selling_price: parseFloat(form.mrp) || 0,
        is_stock_item: 1,
        is_purchase_item: 1,
        is_sales_item: 1,
        valuation_method: "FIFO",
        modified_by: "Administrator",
        image: imagePath,
      };

      let response;
      if (isNew) {
        response = await api.post('/item', payload);
      } else {
        response = await api.put('/item', payload);
      }

      if (response.data && response.data.success === 1) {
        setIsDirty(false);
        toast.success(isNew ? 'Item created successfully!' : 'Item updated successfully!');
        navigate('/item-list');
      } else {
        toast.error(response.data?.message || 'Failed to save item');
      }
    } catch (err: any) {
      console.error('Error saving item:', err);
      if (err.response?.status === 409) {
        toast.error('An item with this code already exists');
      } else if (err.response?.status === 413) {
        toast.error('Request entity too large. Please try with a smaller image.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to save item');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`itf-page ${theme}`}>
        <div className="itf-loading-state">
          <FaSpinner className="spinning" size={32} />
          <p>Loading item data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`itf-page ${theme}`}>
      {/* Top Bar */}
      <div className="itf-topbar">
        <div className="itf-breadcrumb">
          <button onClick={() => navigate('/item-list')} className="itf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-link" onClick={() => navigate("/item-list")}>Stock</span>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-link" onClick={() => navigate("/item-list")}>Item</span>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-current">{isNew ? "New Item" : form.itemName || form.itemCode}</span>
          {!isNew && !form.disabled && <span className="itf-status-pill enabled">Enabled</span>}
          {!isNew && form.disabled && <span className="itf-status-pill disabled">Disabled</span>}
        </div>
        <button className="itf-btn-save" onClick={handleSave} disabled={submitting}>
          {submitting && <FaSpinner className="spinning" />}
          <FaSave size={12} /> Save
        </button>
      </div>

      {/* Main Content */}
      <div className="itf-body">
        <div className="itf-main">
          <form onSubmit={handleSave} className="itf-form">

            {/* Image Upload Card */}
            <div className="itf-card">
              <SectionTitle icon={<FaImage size={16} />}>Item Image</SectionTitle>
              <ImageUpload
                image={form.image}
                onImageChange={handleImageChange}
                onImageRemove={handleImageRemove}
                uploading={uploadingImage}
              />
            </div>

            {/* Item Form Card */}
            <div className="itf-card">
              <SectionTitle icon={<FaTag size={16} />}>Item Details</SectionTitle>
              
              <div className="itf-grid-2">
                <div className="itf-col">
                  <Field label="Item Name" required>
                    <TextInput 
                      value={form.itemName} 
                      onChange={(v) => s("itemName", v)} 
                      placeholder="Enter item name" 
                    />
                  </Field>
                  
                  <Field label="Item Group" required>
                    <SelectInput 
                      value={form.itemGroup} 
                      onChange={(v) => s("itemGroup", v)} 
                      options={groupOptions}
                      loading={loadingGroups}
                      placeholder="Search for an item group..."
                    />
                  </Field>
                  
                  <Field label="Default Unit of Measure" required>
                    <SelectInput 
                      value={form.defaultUOM} 
                      onChange={(v) => s("defaultUOM", v)} 
                      options={uomOptions}
                      loading={loadingUoms}
                      placeholder="Search for a UOM..."
                    />
                  </Field>
                  
                  <Field label="Brand">
                    <TextInput 
                      value={form.brand} 
                      onChange={(v) => s("brand", v)} 
                      placeholder="Enter brand name" 
                    />
                  </Field>
                </div>
                
                <div className="itf-col">
                  <Field label="Description">
                    <TextInput 
                      value={form.description} 
                      onChange={(v) => s("description", v)} 
                      placeholder="Enter item description" 
                    />
                  </Field>
                  
                  <Field 
                    label="Standard Purchase Rate" 
                    hint="The rate at which you purchase this item from supplier (Cost Price)"
                  >
                    <TextInput 
                      value={form.purchaseRate} 
                      onChange={(v) => s("purchaseRate", v)} 
                      type="number"
                      placeholder="0.00"
                    />
                  </Field>
                  
                  <Field 
                    label="MRP" 
                    hint="Maximum Retail Price / Selling Price"
                  >
                    <TextInput 
                      value={form.mrp} 
                      onChange={(v) => s("mrp", v)} 
                      type="number"
                      placeholder="0.00"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
              <div className="itf-validation-errors">
                {validationErrors.map((error, index) => (
                  <div key={index} className="itf-validation-error">
                    <FaExclamationTriangle size={12} />
                    <span>{error.label}: {error.message}</span>
                  </div>
                ))}
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}