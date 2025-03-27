import React, { useState, useEffect } from 'react';
import { MoveUp, MoveDown, Trash2, Copy, ArrowUpDown, X } from 'lucide-react';
import { useAppContext } from '../../store/store';

interface FloatingActionMenuProps {
  visible: boolean;
  onClose: () => void;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ visible, onClose }) => {
  const { 
    state, 
    blocks, 
    updateBlocks, 
    clearBlockSelection 
  } = useAppContext();
  
  const { selectedBlockIds } = state;
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 110, y: 100 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  
  // Actions for selected blocks
  const moveBlocksUp = () => {
    if (selectedBlockIds.length === 0) return;
    
    // Find the minimum index of selected blocks
    const selectedIndices = selectedBlockIds.map(id => 
      blocks.findIndex(block => block.id === id)
    ).filter(index => index !== -1);
    
    if (selectedIndices.length === 0) return;
    
    const minIndex = Math.min(...selectedIndices);
    if (minIndex <= 0) return; // Can't move up if already at the top
    
    // Create new blocks array and insert selected blocks one position up
    const newBlocks = [...blocks];
    const selectedBlocks = selectedBlockIds.map(id => 
      newBlocks.find(block => block.id === id)
    ).filter(Boolean);
    
    // Remove selected blocks
    const filteredBlocks = newBlocks.filter(block => 
      !selectedBlockIds.includes(block.id)
    );
    
    // Insert at new position
    filteredBlocks.splice(minIndex - 1, 0, ...selectedBlocks as any[]);
    updateBlocks(filteredBlocks);
  };
  
  const moveBlocksDown = () => {
    if (selectedBlockIds.length === 0) return;
    
    // Find the maximum index of selected blocks
    const selectedIndices = selectedBlockIds.map(id => 
      blocks.findIndex(block => block.id === id)
    ).filter(index => index !== -1);
    
    if (selectedIndices.length === 0) return;
    
    const maxIndex = Math.max(...selectedIndices);
    if (maxIndex >= blocks.length - 1) return; // Can't move down if already at the bottom
    
    // Create new blocks array and insert selected blocks one position down
    const newBlocks = [...blocks];
    const selectedBlocks = selectedBlockIds.map(id => 
      newBlocks.find(block => block.id === id)
    ).filter(Boolean);
    
    // Remove selected blocks
    const filteredBlocks = newBlocks.filter(block => 
      !selectedBlockIds.includes(block.id)
    );
    
    // Insert at new position - accounting for removed blocks
    const insertPosition = maxIndex + 1 - (selectedIndices.length - 1);
    filteredBlocks.splice(insertPosition, 0, ...selectedBlocks as any[]);
    updateBlocks(filteredBlocks);
  };
  
  const deleteSelectedBlocks = () => {
    if (selectedBlockIds.length === 0) return;
    
    const newBlocks = blocks.filter(block => 
      !selectedBlockIds.includes(block.id)
    );
    
    updateBlocks(newBlocks);
    clearBlockSelection();
    onClose();
  };
  
  const duplicateSelectedBlocks = () => {
    if (selectedBlockIds.length === 0) return;
    
    // Find the maximum index of selected blocks
    const selectedIndices = selectedBlockIds.map(id => 
      blocks.findIndex(block => block.id === id)
    ).filter(index => index !== -1);
    
    if (selectedIndices.length === 0) return;
    
    const maxIndex = Math.max(...selectedIndices);
    
    // Create duplicates of selected blocks with new IDs
    const selectedBlocks = selectedBlockIds
      .map(id => blocks.find(block => block.id === id))
      .filter(Boolean)
      .map(block => ({
        ...block,
        id: `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      }));
    
    // Insert duplicates after the last selected block
    const newBlocks = [...blocks];
    newBlocks.splice(maxIndex + 1, 0, ...selectedBlocks as any[]);
    updateBlocks(newBlocks);
  };
  
  // Handle menu dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartPos) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStartPos.x;
    const newY = touch.clientY - dragStartPos.y;
    
    // Keep menu within screen bounds
    const menuWidth = 220;
    const menuHeight = 50;
    const boundedX = Math.max(0, Math.min(window.innerWidth - menuWidth, newX));
    const boundedY = Math.max(0, Math.min(window.innerHeight - menuHeight, newY));
    
    setPosition({ x: boundedX, y: boundedY });
  };
  
  const handleTouchEnd = () => {
    setDragStartPos(null);
  };
  
  // Handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (visible && !target.closest('.floating-action-menu')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="floating-action-menu fixed z-50 bg-white rounded-lg shadow-lg p-2 flex items-center"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="drag-handle mr-2 cursor-grab text-gray-400">
        <ArrowUpDown size={18} />
      </div>
      
      <button
        onClick={moveBlocksUp}
        className="p-2 rounded-md hover:bg-gray-100"
        aria-label="Move up"
      >
        <MoveUp size={18} />
      </button>
      
      <button
        onClick={moveBlocksDown}
        className="p-2 rounded-md hover:bg-gray-100"
        aria-label="Move down"
      >
        <MoveDown size={18} />
      </button>
      
      <button
        onClick={duplicateSelectedBlocks}
        className="p-2 rounded-md hover:bg-gray-100"
        aria-label="Duplicate"
      >
        <Copy size={18} />
      </button>
      
      <button
        onClick={deleteSelectedBlocks}
        className="p-2 rounded-md hover:bg-gray-100 text-red-500"
        aria-label="Delete"
      >
        <Trash2 size={18} />
      </button>
      
      <button
        onClick={onClose}
        className="p-2 rounded-md hover:bg-gray-100 ml-2"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default FloatingActionMenu; 