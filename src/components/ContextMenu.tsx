'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

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

  // Keep the menu inside the viewport by measuring it after mount.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const margin = 8;
    const { width, height } = menu.getBoundingClientRect();
    const left = Math.max(margin, Math.min(x, window.innerWidth - width - margin));
    const top = Math.max(margin, Math.min(y, window.innerHeight - height - margin));
    setPosition({ left, top });
  }, [x, y]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    zIndex: 1000, // High z-index
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
