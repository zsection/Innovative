import React, { useRef, useEffect } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close when pressing escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to ensure the menu stays within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200), // Assuming menu width ~200px
    y: Math.min(position.y, window.innerHeight - (items.length * 40)) // Each item ~40px height
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-white border border-swiss-black rounded-sm shadow-md min-w-[180px]"
      style={{ 
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      <div className="py-1">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`px-4 py-2 text-base cursor-pointer hover:bg-swiss-lightGray ${
              item.danger ? 'text-red-600' : ''
            }`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextMenu; 