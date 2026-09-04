import React from 'react';
import './PageLoader.css';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';

interface PageLoaderProps {
  message?: string;
  subtitle?: string;
  variant?: 'fullpage' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PageLoader({
  message = 'Loading workspace data...',
  subtitle = 'Please wait while we synchronize your latest records',
  variant = 'fullpage',
  size = 'md',
  className = '',
}: PageLoaderProps) {
  const { theme } = useAdminTheme();

  const scaleStyle = size === 'sm' 
    ? { transform: 'scale(0.8)' } 
    : size === 'lg' 
    ? { transform: 'scale(1.2)' } 
    : undefined;

  return (
    <div 
      className={`pl-container pl-container--${variant} admin-theme ${theme} ${className}`}
      id="app-page-loader"
      role="status"
      aria-live="polite"
    >
      <div className="pl-spinner-wrapper" style={scaleStyle}>
        <div className="pl-spinner-pulse" />
        <div className="pl-spinner-ring" />
        <div className="pl-spinner-core">
          <div className="pl-spinner-dots">
            <span className="pl-spinner-dot" />
            <span className="pl-spinner-dot" />
            <span className="pl-spinner-dot" />
          </div>
        </div>
      </div>

      {message && <h3 className="pl-title">{message}</h3>}
      {subtitle && <p className="pl-subtitle">{subtitle}</p>}
    </div>
  );
}

/**
 * Top horizontal indeterminate progress bar for route changes and async events
 */
export function TopProgressBar({ active = true }: { active?: boolean }) {
  if (!active) return null;
  return <div className="pl-top-bar" id="app-top-progress-bar" aria-hidden="true" />;
}

/**
 * Skeleton loader for data tables (e.g. Leads, Customers, Items, Invoices)
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  header = true,
}: {
  rows?: number;
  columns?: number;
  header?: boolean;
}) {
  return (
    <div className="w-full space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in">
      {/* Search & Actions Bar Skeleton */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="h-9 w-64 pl-skeleton-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 pl-skeleton-pulse" />
          <div className="h-9 w-28 pl-skeleton-pulse" />
        </div>
      </div>

      {/* Header Row */}
      {header && (
        <div className="grid gap-3 py-2 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, idx) => (
            <div key={idx} className="h-4 pl-skeleton-pulse" style={{ width: `${60 + (idx % 3) * 15}%` }} />
          ))}
        </div>
      )}

      {/* Row placeholders */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="grid gap-3 py-3 px-3 border-b border-slate-100 dark:border-slate-800/80 items-center"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3.5 pl-skeleton-pulse"
                style={{ width: `${40 + ((rIdx + cIdx) % 5) * 12}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card skeleton grid for dashboards & metric overviews
 */
export function CardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-fade-in">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 pl-skeleton-pulse" />
            <div className="h-8 w-8 rounded-lg pl-skeleton-pulse" />
          </div>
          <div className="h-8 w-32 pl-skeleton-pulse" />
          <div className="h-3 w-40 pl-skeleton-pulse" />
        </div>
      ))}
    </div>
  );
}

export default PageLoader;
