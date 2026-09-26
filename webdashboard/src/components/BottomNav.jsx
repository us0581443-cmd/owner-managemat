'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, ReceiptText, Users } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/flats', label: 'Flats', icon: Building2 },
    { href: '/payments', label: 'Ledger', icon: ReceiptText },
    { href: '/customers', label: 'Customers', icon: Users },
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation Bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-tab-item ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <div className="tab-icon-wrap">
              <Icon size={19} strokeWidth={isActive ? 1.75 : 1.35} />
            </div>
            <span className="tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

