import React, { useState } from 'react';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

import BranchSwitcher from './BranchSwitcher';

interface BranchSwitcherProviderProps {
  children?: React.ReactNode;
}

const BranchSwitcherProvider: React.FC<BranchSwitcherProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // Global keyboard shortcut: Ctrl+B
  useKeyboardShortcuts([
    {
      key: 'b',
      ctrlKey: true,
      callback: handleOpen,
      preventDefault: true
    }
  ]);

  return (
    <>
      {children}
      <BranchSwitcher
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
};

export default BranchSwitcherProvider;