'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, displayName);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Don't close immediately - show success message
      setTimeout(() => {
        onClose();
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setSuccess(false);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(var(--background-rgb), 0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(var(--shadow), 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-2xl font-mono font-bold mb-2"
            style={{ color: 'var(--primary)' }}
          >
            {t('Sign Up')}
          </h2>
          <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Create an account to contribute to the project
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div
            className="mb-4 p-3"
            style={{
              backgroundColor: 'rgba(var(--success-rgb), 0.1)',
              border: '1px solid var(--success)',
            }}
          >
            <p className="text-sm font-mono" style={{ color: 'var(--success)' }}>
              Account created! Please check your email to confirm your account.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="mb-4 p-3"
            style={{
              backgroundColor: 'rgba(var(--danger-rgb), 0.1)',
              border: '1px solid var(--danger)',
            }}
          >
            <p className="text-sm font-mono" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-mono mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
              placeholder="Your Name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-mono mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-mono mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
              placeholder="••••••••"
            />
            <p className="text-xs mt-1 font-mono" style={{ color: 'var(--foreground-muted)' }}>
              At least 6 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-mono mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
              placeholder="••••••••"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 font-mono text-sm font-bold transition-opacity"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
                outline: 'none',
                opacity: loading || success ? 0.6 : 1,
                cursor: loading || success ? 'not-allowed' : 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                if (!loading && !success) e.currentTarget.style.opacity = '1';
              }}
            >
              {loading ? 'Creating account...' : success ? 'Success!' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3 font-mono text-sm transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground-muted)',
                border: '1px solid var(--border)',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = '1';
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Switch to login */}
        <div className="mt-6 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-mono font-bold"
              style={{
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.boxShadow = 'none';
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SignupModal);
