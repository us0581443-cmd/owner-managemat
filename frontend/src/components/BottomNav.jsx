import React from 'react';
import { Home, KeyRound, ReceiptText, Users } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'flats', label: 'Flats', icon: KeyRound },
    { id: 'payments', label: 'Payments', icon: ReceiptText },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
          >
            <div className="tab-icon-wrap">
              <Icon className="tab-icon" strokeWidth={isActive ? 1.55 : 1.25} />
            </div>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
