import React from 'react';

interface SummaryCardData {
  label: string;
  value: number | string;
  color: string;
  icon?: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

interface SummaryCardsProps {
  data: Record<string, SummaryCardData> | SummaryCardData[];
  className?: string;
  columns?: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  data, 
  className = '',
  columns = 4 
}) => {
  const cards = Array.isArray(data) ? data : Object.values(data);

  return (
    <div 
      className={`summary-cards ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${Math.min(columns, cards.length)}, 1fr)`
      }}
    >
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="summary-card"
          style={{ borderLeftColor: card.color }}
        >
          <div className="summary-card-header">
            <span className="summary-card-label">
              {card.icon && <span className="summary-card-icon">{card.icon}</span>}
              {card.label}
            </span>
            {card.change && (
              <span className={`summary-card-change ${card.changeType || 'neutral'}`}>
                {card.change}
              </span>
            )}
          </div>
          <div className="summary-card-value">{card.value}</div>
        </div>
      ))}
    </div>
  );
};