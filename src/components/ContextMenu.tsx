'use client';
import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Use capture phase to ensure handler runs before potential clicks within the menu children bubble up
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);


  // Adjust position to ensure it stays within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000, // High z-index
    // Add logic here to check viewport bounds and adjust top/left if needed
    // Example: If y + menuHeight > window.innerHeight, set top to window.innerHeight - menuHeight
  };


  return (
    <div
      ref={menuRef}
      style={style}
      className="bg-gray-800 text-white border border-gray-700 rounded shadow-lg py-1 min-w-[150px]"
      // Prevent context menu on the context menu itself
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
};

export default ContextMenu;
