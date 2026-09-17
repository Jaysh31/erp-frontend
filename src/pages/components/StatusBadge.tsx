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
      'Pending': { color: '#b45309', bg: '#fef3c7', label: 'Pending' },
      'Partial': { color: '#839ee9', bg: '#dbeafe', label: 'Partial' },
      'Paid': { color: '#047857', bg: '#d1fae5', label: 'Paid' },
      'Invoiced': { color: '#6d28d9', bg: '#ede9fe', label: 'Invoiced' },
      'Draft': { color: '#475569', bg: '#e2e8f0', label: 'Draft' },
      'Sent': { color: '#1e40af', bg: '#dbeafe', label: 'Sent' },
      'Overdue': { color: '#b91c1c', bg: '#fee2e2', label: 'Overdue' },
      'Cancelled': { color: '#b45309', bg: '#fef3c7', label: 'Cancelled' },
      'Active': { color: '#047857', bg: '#d1fae5', label: 'Active' },
      'Inactive': { color: '#475569', bg: '#e2e8f0', label: 'Inactive' },
    };
    return configs[status] || { color: '#475569', bg: '#e2e8f0', label: status };
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