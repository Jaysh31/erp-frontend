import React from 'react';

interface StatusBadgeProps {
  status: string;
  config?: {
    color: string;
    bg: string;
    label: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  config, 
  className = '',
  children 
}) => {
  const getDefaultConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      'Pending': { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
      'Partial': { color: '#3b82f6', bg: '#eff6ff', label: 'Partial' },
      'Paid': { color: '#10b981', bg: '#ecfdf5', label: 'Paid' },
      'Invoiced': { color: '#8b5cf6', bg: '#f5f3ff', label: 'Invoiced' },
      'Draft': { color: '#94a3b8', bg: '#f1f5f9', label: 'Draft' },
      'Sent': { color: '#3b82f6', bg: '#eff6ff', label: 'Sent' },
      'Overdue': { color: '#ef4444', bg: '#fef2f2', label: 'Overdue' },
      'Cancelled': { color: '#f59e0b', bg: '#fffbeb', label: 'Cancelled' },
      'Active': { color: '#10b981', bg: '#ecfdf5', label: 'Active' },
      'Inactive': { color: '#94a3b8', bg: '#f1f5f9', label: 'Inactive' },
    };
    return configs[status] || { color: '#94a3b8', bg: '#f1f5f9', label: status };
  };

  const finalConfig = config || getDefaultConfig(status);

  return (
    <span 
      className={`status-badge ${className}`}
      style={{ 
        color: finalConfig.color, 
        background: finalConfig.bg 
      }}
    >
      <span className="dot" style={{ background: finalConfig.color }} />
      {children || finalConfig.label}
    </span>
  );
};