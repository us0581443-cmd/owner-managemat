'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, KeyRound, ReceiptText, Users } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/flats', label: 'Flats', icon: KeyRound },
    { href: '/payments', label: 'Payments', icon: ReceiptText },
    { href: '/customers', label: 'Customers', icon: Users },
  ];

  return (
    <nav className="bottom-nav">
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
              <Icon className="tab-icon" strokeWidth={isActive ? 1.55 : 1.25} />
            </div>
            <span className="tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
