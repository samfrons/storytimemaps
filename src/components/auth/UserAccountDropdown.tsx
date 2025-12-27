'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const UserAccountDropdown: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
  };

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 font-mono text-sm transition-opacity"
        style={{
          backgroundColor: 'var(--card-bg)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.outline = 'none';
          e.target.style.boxShadow = 'none';
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {/* User avatar circle */}
        <div
          className="w-6 h-6 flex items-center justify-center font-bold text-xs"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
          }}
        >
          {displayName[0].toUpperCase()}
        </div>
        <span>{displayName}</span>
        {profile?.is_admin && (
          <span
            className="px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: 'rgba(var(--warning-rgb), 0.2)',
              color: 'var(--warning)',
              border: '1px solid var(--warning)',
            }}
          >
            ADMIN
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 py-2 z-50"
          style={{
            backgroundColor: 'var(--dropdown-bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(var(--shadow), 0.3)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-mono font-bold" style={{ color: 'var(--foreground)' }}>
              {displayName}
            </p>
            <p className="text-xs font-mono truncate" style={{ color: 'var(--foreground-muted)' }}>
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                router.push('/dashboard');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left font-mono text-sm transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                border: 'none',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              My Dashboard
            </button>

            <button
              onClick={() => {
                router.push('/dashboard/proposals');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left font-mono text-sm transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                border: 'none',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              My Proposals
            </button>

            {profile?.is_admin && (
              <button
                onClick={() => {
                  router.push('/admin/proposals');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left font-mono text-sm transition-opacity"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--warning)',
                  border: 'none',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = 'none';
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(var(--warning-rgb), 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Admin Panel
              </button>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t pt-1" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left font-mono text-sm transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--danger)',
                border: 'none',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(var(--danger-rgb), 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(UserAccountDropdown);
