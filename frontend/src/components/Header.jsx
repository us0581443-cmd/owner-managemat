import React from 'react';
import { LogOut, User, Edit3 } from 'lucide-react';

export default function Header({ currentUser, onLogout, onEditProfile }) {
  return (
    <header className="app-top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          background: 'var(--color-blue)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '16px',
          fontFamily: 'var(--font-heading)'
        }}>
          N
        </div>
        <span style={{
          fontSize: '19px',
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: '0.6px',
          fontFamily: 'var(--font-heading)'
        }}>
          NEST
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {currentUser ? (
          <>
            <button
              type="button"
              onClick={onEditProfile}
              title="Edit Owner Profile (Photo, Phone, Address)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '11px',
                color: '#ffffff',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '3px 10px 3px 4px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: '170px',
                cursor: 'pointer'
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '800',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {currentUser.profile_image ? (
                  <img
                    src={currentUser.profile_image}
                    alt="Owner"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}</span>
                )}
              </div>

              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name || currentUser.email}
              </span>

              <Edit3 size={11} color="#93C5FD" style={{ flexShrink: 0, opacity: 0.8 }} />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log Out"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                <LogOut size={12} />
                <span>Exit</span>
              </button>
            )}
          </>
        ) : (
          <div style={{
            fontSize: '11px',
            color: '#93c5fd',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            Owner Portal
          </div>
        )}
      </div>
    </header>
  );
}
