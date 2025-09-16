import { useCallback, useEffect, useRef } from 'react';

interface UseVirtualizationAccessibilityOptions {
  totalItems: number;
  visibleRange: { start: number; end: number };
  itemHeight?: number;
  containerHeight?: number;
}

/**
 * Hook to provide accessibility features for virtualized lists
 * - Announces item counts and changes to screen readers
 * - Provides keyboard navigation support
 * - Maintains focus management
 */
export const useVirtualizationAccessibility = ({
  totalItems,
  visibleRange,
  itemHeight = 80,
  containerHeight = 600,
}: UseVirtualizationAccessibilityOptions) => {
  const announceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible items for screen reader announcements
  const visibleItems = visibleRange.end - visibleRange.start + 1;

  // Announce changes to screen readers
  const announceChange = useCallback((message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
      // Clear after announcement to avoid repetition
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) return;

    const { key, ctrlKey, altKey } = event;
    
    switch (key) {
      case 'Home':
        event.preventDefault();
        announceChange(`Moved to first item of ${totalItems} items`);
        break;
      case 'End':
        event.preventDefault();
        announceChange(`Moved to last item of ${totalItems} items`);
        break;
      case 'PageUp':
        event.preventDefault();
        const pageUpItems = Math.floor(containerHeight / itemHeight);
        announceChange(`Moved up ${pageUpItems} items`);
        break;
      case 'PageDown':
        event.preventDefault();
        const pageDownItems = Math.floor(containerHeight / itemHeight);
        announceChange(`Moved down ${pageDownItems} items`);
        break;
    }
  }, [totalItems, containerHeight, itemHeight, announceChange]);

  // Announce visible range changes
  useEffect(() => {
    const message = `Showing items ${visibleRange.start + 1} to ${visibleRange.end + 1} of ${totalItems} total items`;
    announceChange(message);
  }, [visibleRange.start, visibleRange.end, totalItems, announceChange]);

  // Set up keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ARIA attributes for the container
  const containerAriaProps = {
    role: 'grid' as const,
    'aria-label': `Data grid with ${totalItems} items`,
    'aria-rowcount': totalItems,
    'aria-colcount': 1,
    tabIndex: 0,
  };

  // Screen reader announcement element
  const AnnouncementArea = () => (
    <div
      ref={announceRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return {
    containerRef,
    containerAriaProps,
    AnnouncementArea,
    announceChange,
  };
};

/**
 * Hook for managing focus in virtualized components
 */
export const useVirtualizedFocus = () => {
  const focusRef = useRef<{ itemIndex: number; element: HTMLElement | null }>({
    itemIndex: -1,
    element: null,
  });

  const setFocusedItem = useCallback((itemIndex: number, element: HTMLElement | null) => {
    focusRef.current = { itemIndex, element };
  }, []);

  const getFocusedItem = useCallback(() => {
    return focusRef.current;
  }, []);

  const restoreFocus = useCallback(() => {
    const { element } = focusRef.current;
    if (element && document.body.contains(element)) {
      element.focus();
    }
  }, []);

  return {
    setFocusedItem,
    getFocusedItem,
    restoreFocus,
  };
};