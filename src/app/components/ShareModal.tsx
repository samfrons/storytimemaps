// file: src/app/components/ShareModal.tsx

import React from 'react';
import { StoryMap } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  story?: StoryMap; // Optional - if not provided, shares the website
  currentDate?: Date;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
  description: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, story, currentDate }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const [copyType, setCopyType] = React.useState<'link' | 'instagram' | null>(null);

  // Generate the share URL
  const getShareUrl = React.useCallback(() => {
    if (typeof window === 'undefined') return '';

    const baseUrl = window.location.origin;

    if (story) {
      // Share a specific story
      const params = new URLSearchParams();
      params.set('id', story.id);
      if (currentDate) {
        params.set('date', currentDate.toISOString().split('T')[0]);
      }
      return `${baseUrl}?${params.toString()}`;
    }

    // Share the website
    return baseUrl;
  }, [story, currentDate]);

  // Generate share text
  const getShareText = React.useCallback(() => {
    if (story) {
      const title = story.title;
      const address = story.address ? ` at ${story.address}` : '';
      const period = story.startDate && story.endDate
        ? ` (${new Date(story.startDate).getFullYear()}-${new Date(story.endDate).getFullYear()})`
        : '';
      return `${title}${address}${period} - Jewish Businesses in Berlin 1900-1945`;
    }
    return 'Jewish Businesses in Berlin 1900-1945 - Interactive historical map documenting Jewish-owned businesses';
  }, [story]);

  // Generate email subject and body
  const getEmailContent = React.useCallback(() => {
    if (story) {
      return {
        subject: `${story.title} - Jewish Businesses in Berlin`,
        body: `I wanted to share this historical business with you:\n\n${story.title}\n${story.address || ''}\n\n${story.description || ''}\n\nView on the interactive map: ${getShareUrl()}`
      };
    }
    return {
      subject: 'Jewish Businesses in Berlin 1900-1945',
      body: `I wanted to share this interactive historical map with you:\n\nJewish Businesses in Berlin 1900-1945\n\nAn interactive map documenting Jewish-owned businesses in Berlin from 1900-1945.\n\nExplore it here: ${getShareUrl()}`
    };
  }, [story, getShareUrl]);

  // Copy link to clipboard
  const copyToClipboard = React.useCallback(async (type: 'link' | 'instagram') => {
    try {
      const textToCopy = type === 'instagram'
        ? `${getShareText()}\n\n${getShareUrl()}`
        : getShareUrl();

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setCopyType(type);
      setTimeout(() => {
        setCopied(false);
        setCopyType(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [getShareUrl, getShareText]);

  // Share via native share API if available
  const nativeShare = React.useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title || 'Jewish Businesses in Berlin 1900-1945',
          text: getShareText(),
          url: getShareUrl()
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed:', err);
      }
    }
  }, [story, getShareText, getShareUrl]);

  // Share options
  const shareOptions: ShareOption[] = React.useMemo(() => {
    const url = getShareUrl();
    const text = getShareText();
    const emailContent = getEmailContent();

    return [
      {
        id: 'copy',
        name: t('share.copyLink', { ns: 'common', defaultValue: 'Copy Link' }),
        description: t('share.copyLinkDesc', { ns: 'common', defaultValue: 'Copy the link to clipboard' }),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {copied && copyType === 'link' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            )}
          </svg>
        ),
        action: () => copyToClipboard('link')
      },
      {
        id: 'email',
        name: t('share.email', { ns: 'common', defaultValue: 'Email' }),
        description: t('share.emailDesc', { ns: 'common', defaultValue: 'Send via email' }),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        action: () => {
          window.open(`mailto:?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`, '_blank');
        }
      },
      {
        id: 'facebook',
        name: 'Facebook',
        description: t('share.facebookDesc', { ns: 'common', defaultValue: 'Share on Facebook' }),
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        ),
        action: () => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        }
      },
      {
        id: 'twitter',
        name: 'X (Twitter)',
        description: t('share.twitterDesc', { ns: 'common', defaultValue: 'Share on X' }),
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        ),
        action: () => {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        }
      },
      {
        id: 'instagram',
        name: 'Instagram',
        description: t('share.instagramDesc', { ns: 'common', defaultValue: 'Copy text for Instagram' }),
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        ),
        action: () => copyToClipboard('instagram')
      }
    ];
  }, [t, copied, copyType, getShareUrl, getShareText, getEmailContent, copyToClipboard]);

  // Handle keyboard escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(var(--background-rgb), 0.85)',
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm mx-4 border shadow-lg"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3
            className="font-mono text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--foreground)' }}
          >
            {story
              ? t('share.shareStory', { ns: 'common', defaultValue: 'Share Story' })
              : t('share.shareWebsite', { ns: 'common', defaultValue: 'Share' })
            }
          </h3>
          <button
            onClick={onClose}
            className="p-1 transition-colors"
            style={{ color: 'var(--foreground-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--foreground-muted)';
            }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Story info if sharing a story */}
        {story && (
          <div
            className="p-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <p
              className="font-mono text-sm font-semibold mb-1"
              style={{ color: 'var(--primary)' }}
            >
              {story.title}
            </p>
            {story.address && (
              <p
                className="font-mono text-xs"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {story.address}
              </p>
            )}
          </div>
        )}

        {/* Share options */}
        <div className="p-2">
          {/* Native share button if available */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={nativeShare}
              className="w-full flex items-center gap-3 p-3 transition-colors text-left"
              style={{ color: 'var(--foreground)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center border"
                style={{
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold">
                  {t('share.shareVia', { ns: 'common', defaultValue: 'Share via...' })}
                </p>
                <p
                  className="font-mono text-xs"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('share.shareViaDesc', { ns: 'common', defaultValue: 'Use system share options' })}
                </p>
              </div>
            </button>
          )}

          {/* Share options grid */}
          <div className="grid grid-cols-1 gap-1">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className="w-full flex items-center gap-3 p-3 transition-colors text-left"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center border"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground-muted)'
                  }}
                >
                  {option.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold">
                    {option.name}
                    {copied && copyType === option.id.replace('copy', 'link') && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: 'var(--success)' }}
                      >
                        {t('share.copied', { ns: 'common', defaultValue: 'Copied!' })}
                      </span>
                    )}
                    {copied && option.id === 'instagram' && copyType === 'instagram' && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: 'var(--success)' }}
                      >
                        {t('share.copied', { ns: 'common', defaultValue: 'Copied!' })}
                      </span>
                    )}
                    {copied && option.id === 'copy' && copyType === 'link' && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: 'var(--success)' }}
                      >
                        {t('share.copied', { ns: 'common', defaultValue: 'Copied!' })}
                      </span>
                    )}
                  </p>
                  <p
                    className="font-mono text-xs"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* URL Preview */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <p
            className="font-mono text-xs mb-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('share.linkPreview', { ns: 'common', defaultValue: 'Link Preview' })}
          </p>
          <div
            className="p-2 font-mono text-xs break-all border"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            {getShareUrl()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ShareModal);
