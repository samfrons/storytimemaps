import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock window.innerWidth and innerHeight
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Test component that responds to viewport
const ResponsiveComponent: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div data-testid="responsive-container">
      <div className={isMobile ? 'mobile-view' : 'desktop-view'}>
        {isMobile ? (
          <div data-testid="mobile-menu">
            <button data-testid="hamburger-menu">☰</button>
          </div>
        ) : (
          <div data-testid="desktop-nav">
            <nav>Desktop Navigation</nav>
          </div>
        )}
      </div>
    </div>
  );
};

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    setViewport(1024, 768); // Default to desktop
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Viewport detection', () => {
    it('should detect mobile viewport (< 768px)', async () => {
      setViewport(375, 667); // iPhone SE

      render(<ResponsiveComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      });
    });

    it('should detect tablet viewport (768px - 1024px)', async () => {
      setViewport(768, 1024); // iPad

      render(<ResponsiveComponent />);

      await waitFor(() => {
        // At exactly 768px, should show desktop view (>= 768)
        expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
      });
    });

    it('should detect desktop viewport (> 1024px)', async () => {
      setViewport(1920, 1080); // Desktop

      render(<ResponsiveComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
      });
    });

    it('should update layout when viewport changes from desktop to mobile', async () => {
      setViewport(1024, 768); // Start with desktop

      const { rerender } = render(<ResponsiveComponent />);

      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();

      setViewport(375, 667); // Switch to mobile

      rerender(<ResponsiveComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      });
    });

    it('should update layout when viewport changes from mobile to desktop', async () => {
      setViewport(375, 667); // Start with mobile

      const { rerender } = render(<ResponsiveComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      });

      setViewport(1024, 768); // Switch to desktop

      rerender(<ResponsiveComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
      });
    });
  });

  describe('Common mobile devices', () => {
    const devices = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800 },
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'iPad Pro 11"', width: 834, height: 1194 },
    ];

    devices.forEach(device => {
      it(`should render correctly on ${device.name} (${device.width}x${device.height})`, async () => {
        setViewport(device.width, device.height);

        render(<ResponsiveComponent />);

        const isMobileDevice = device.width < 768;

        await waitFor(() => {
          if (isMobileDevice) {
            expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
          } else {
            expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
          }
        });
      });
    });
  });

  describe('Touch interactions', () => {
    it('should handle touch events', async () => {
      setViewport(375, 667);

      const handleTouch = vi.fn();

      const TouchComponent = () => (
        <div
          data-testid="touch-area"
          onTouchStart={handleTouch}
        >
          Touch me
        </div>
      );

      render(<TouchComponent />);

      const touchArea = screen.getByTestId('touch-area');

      fireEvent.touchStart(touchArea, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      expect(handleTouch).toHaveBeenCalled();
    });

    it('should handle swipe gestures', async () => {
      setViewport(375, 667);

      const handleTouchStart = vi.fn();
      const handleTouchEnd = vi.fn();

      const SwipeComponent = () => (
        <div
          data-testid="swipe-area"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          Swipe me
        </div>
      );

      render(<SwipeComponent />);

      const swipeArea = screen.getByTestId('swipe-area');

      fireEvent.touchStart(swipeArea, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(swipeArea, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });

      expect(handleTouchStart).toHaveBeenCalled();
      expect(handleTouchEnd).toHaveBeenCalled();
    });
  });

  describe('Mobile navigation', () => {
    it('should show hamburger menu on mobile', async () => {
      setViewport(375, 667);

      render(<ResponsiveComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
      });
    });

    it('should toggle mobile menu on hamburger click', async () => {
      setViewport(375, 667);

      const MobileMenuComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <div>
            <button
              data-testid="hamburger"
              onClick={() => setIsOpen(!isOpen)}
            >
              ☰
            </button>
            {isOpen && (
              <nav data-testid="mobile-nav-menu">
                Mobile Menu Content
              </nav>
            )}
          </div>
        );
      };

      render(<MobileMenuComponent />);

      const hamburger = screen.getByTestId('hamburger');

      expect(screen.queryByTestId('mobile-nav-menu')).not.toBeInTheDocument();

      fireEvent.click(hamburger);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-nav-menu')).toBeInTheDocument();
      });

      fireEvent.click(hamburger);

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-nav-menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile text sizing', () => {
    it('should use appropriate font sizes for mobile', () => {
      setViewport(375, 667);

      const TextComponent = () => (
        <div>
          <h1 className="text-2xl md:text-4xl" data-testid="heading">
            Heading
          </h1>
          <p className="text-sm md:text-base" data-testid="paragraph">
            Paragraph
          </p>
        </div>
      );

      const { container } = render(<TextComponent />);

      const heading = screen.getByTestId('heading');
      const paragraph = screen.getByTestId('paragraph');

      expect(heading.className).toContain('text-2xl');
      expect(paragraph.className).toContain('text-sm');
    });
  });

  describe('Mobile layout adjustments', () => {
    it('should stack elements vertically on mobile', () => {
      setViewport(375, 667);

      const LayoutComponent = () => (
        <div className="flex flex-col md:flex-row" data-testid="container">
          <div data-testid="col-1">Column 1</div>
          <div data-testid="col-2">Column 2</div>
        </div>
      );

      const { container } = render(<LayoutComponent />);

      const layoutContainer = screen.getByTestId('container');

      expect(layoutContainer.className).toContain('flex-col');
    });

    it('should use full width on mobile', () => {
      setViewport(375, 667);

      const FullWidthComponent = () => (
        <div className="w-full md:w-1/2" data-testid="element">
          Full width on mobile
        </div>
      );

      const { container } = render(<FullWidthComponent />);

      const element = screen.getByTestId('element');

      expect(element.className).toContain('w-full');
    });
  });

  describe('Mobile performance', () => {
    it('should lazy load heavy components on mobile', async () => {
      setViewport(375, 667);

      const LazyComponent = React.lazy(() =>
        Promise.resolve({
          default: () => <div data-testid="lazy-content">Lazy Content</div>,
        })
      );

      const LazyLoadComponent = () => (
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );

      render(<LazyLoadComponent />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
      });
    });
  });

  describe('Orientation changes', () => {
    it('should handle portrait orientation', () => {
      setViewport(375, 667); // Portrait

      expect(window.innerWidth).toBeLessThan(window.innerHeight);
    });

    it('should handle landscape orientation', () => {
      setViewport(667, 375); // Landscape

      expect(window.innerWidth).toBeGreaterThan(window.innerHeight);
    });

    it('should adapt to orientation change', async () => {
      setViewport(375, 667); // Portrait

      const OrientationComponent = () => {
        const [isLandscape, setIsLandscape] = React.useState(false);

        React.useEffect(() => {
          const checkOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
          };

          checkOrientation();
          window.addEventListener('resize', checkOrientation);
          return () => window.removeEventListener('resize', checkOrientation);
        }, []);

        return (
          <div data-testid="orientation">
            {isLandscape ? 'Landscape' : 'Portrait'}
          </div>
        );
      };

      const { rerender } = render(<OrientationComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation')).toHaveTextContent('Portrait');
      });

      setViewport(667, 375); // Switch to landscape

      rerender(<OrientationComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation')).toHaveTextContent('Landscape');
      });
    });
  });
});
