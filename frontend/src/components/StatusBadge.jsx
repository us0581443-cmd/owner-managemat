import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Home, Repeat, UserPlus } from 'lucide-react';

export default function StatusBadge({ status, text, size = 'normal' }) {
  const norm = (status || '').toLowerCase();

  let badgeClass = 'badge-blue';
  let Icon = null;
  let displayText = text || status;

  if (norm === 'paid' || norm === 'occupied' || norm === 'active' || norm.includes('booked')) {
    badgeClass = 'badge-mint';
    Icon = CheckCircle2;
  } else if (norm === 'pending' || norm === 'partial' || norm.includes('repeat')) {
    badgeClass = 'badge-amber';
    Icon = norm.includes('repeat') ? Repeat : Clock;
    if (!text && norm === 'partial') displayText = 'Partial';
  } else if (norm === 'late' || norm === 'vacant' || norm === 'overdue') {
    badgeClass = 'badge-coral';
    Icon = norm === 'vacant' ? Home : AlertCircle;
  } else if (norm.includes('new customer')) {
    badgeClass = 'badge-blue';
    Icon = UserPlus;
  }

  return (
    <span className={`badge ${badgeClass} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {Icon && <Icon size={13} />}
      <span>{displayText}</span>
    </span>
  );
}
