import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Sparkles, Building2 } from 'lucide-react';

export default function StatusBadge({ status, text, size = 'md' }) {
  const normalized = (status || '').toLowerCase();
  let badgeClass = 'badge-navy';
  let Icon = Building2;
  let displayText = text || status;

  if (normalized === 'rented' || normalized === 'booked' || normalized === 'active' || normalized === 'paid') {
    badgeClass = 'badge-mint';
    Icon = CheckCircle2;
    if (!text) displayText = normalized === 'paid' ? 'Paid' : 'Booked';
  } else if (normalized === 'vacant' || normalized === 'overdue' || normalized === 'late' || normalized === 'maintenance') {
    badgeClass = 'badge-coral';
    Icon = AlertCircle;
    if (!text) displayText = normalized === 'vacant' ? 'Vacant' : normalized;
  } else if (normalized === 'pending' || normalized === 'partial' || normalized === 'repeat') {
    badgeClass = 'badge-amber';
    Icon = normalized === 'repeat' ? RefreshCw : Clock;
    if (!text) {
      displayText = normalized === 'repeat' ? 'Repeat Customer' : (normalized === 'partial' ? 'Partial' : 'Pending');
    }
  } else if (normalized === 'new customer' || normalized === 'new') {
    badgeClass = 'badge-blue';
    Icon = Sparkles;
    if (!text) displayText = 'New Customer';
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        padding: isSmall ? '2px 8px' : '4px 10px',
        fontSize: isSmall ? '10.5px' : '11.5px',
      }}
    >
      {Icon && <Icon size={isSmall ? 11 : 13} />}
      <span>{displayText}</span>
    </span>
  );
}
