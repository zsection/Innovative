import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../store/store';
import Block from './Block';
import { Block as BlockType, BlockType as BlockTypeEnum } from '../../utils/types';
import BlockCommandMenu from './BlockCommandMenu';

const BlockEditor: React.FC = () => {
  const { state, blocks, addBlock, updateBlocks } = useAppContext();
  const { activeView } = state;
  const editorRef = useRef<HTMLDivElement>(null);
  const emptyBlockRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [emptyBlockContent, setEmptyBlockContent] = useState('');
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] = useState<HTMLElement | null>(null);
  
  // Listen for clicks outside of blocks to focus on empty block or input
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // If clicking in the editor area but not on a specific block, focus the empty block
      if (editorRef.current && editorRef.current.contains(e.target as Node)) {
        // Don't trigger if clicking on an existing block or button
        const isClickOnBlock = (e.target as Element).closest('.block-item') !== null;
        const isClickOnButton = (e.target as Element).closest('button') !== null;
        const isClickOnInput = (e.target as Element).closest('input') !== null;
        
        if (!isClickOnBlock && !isClickOnButton && !isClickOnInput && emptyBlockRef.current) {
          emptyBlockRef.current.focus();
        }
      }
    };
    
    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);
  
  const handleAddTask = () => {
    const input = document.getElementById('task-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      addBlock();
      input.value = '';
    }
  };

  // Handle the empty block content changes
  const handleEmptyBlockChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    setEmptyBlockContent(e.currentTarget.textContent || '');
  };

  // Calculate position for the command menu
  const updateCommandMenuPosition = (source: 'input' | 'empty-block') => {
    const element = source === 'input' ? inputRef.current : emptyBlockRef.current;
    if (!element) return;
    
    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.font = window.getComputedStyle(element).font;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    
    // Get the text before the cursor
    let textBeforeCursor = '';
    if (source === 'input') {
      const input = element as HTMLInputElement;
      textBeforeCursor = input.value.substring(0, input.selectionStart || 0);
    } else {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      textBeforeCursor = range ? range.startContainer.textContent?.substring(0, range.startOffset) || '' : '';
    }
    
    // Measure the width
    span.textContent = textBeforeCursor;
    document.body.appendChild(span);
    const textWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    
    // Get element position
    const rect = element.getBoundingClientRect();
    
    // Account for padding in the container
    const containerRect = editorRef.current?.getBoundingClientRect();
    const leftPadding = containerRect ? rect.left - containerRect.left : 0;
    
    // Create and position the menu anchor
    const anchorElement = document.createElement('div');
    anchorElement.style.position = 'absolute';
    anchorElement.style.left = `${leftPadding + textWidth - 16}px`;
    anchorElement.style.top = `${rect.top - (containerRect?.top || 0) + (source === 'input' ? -8 : -12)}px`;
    anchorElement.style.height = `${rect.height}px`;
    
    setCommandMenuAnchor(anchorElement);
  };

  // Handle command menu selection
  const handleCommandSelect = (commandType: string) => {
    setShowCommandMenu(false);

    // Create new block with the selected type
    const newBlock: BlockType = {
      id: `block-${Date.now()}`,
      type: commandType as BlockTypeEnum,
      content: '',
      priority: '',
      tags: [],
      collapsed: false,
      children: [],
      checked: false
    };

    // Add the new block
    const newBlocks = [...blocks, newBlock];
    updateBlocks(newBlocks);

    // Clear the input or empty block based on where the command was triggered
    if (inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.value = '';
    } else if (emptyBlockRef.current) {
      emptyBlockRef.current.textContent = '';
    }

    // Focus the newly created block after a short delay to allow for rendering
    setTimeout(() => {
      const newBlockElement = document.querySelector(`#block-${newBlock.id}`) as HTMLTextAreaElement;
      if (newBlockElement) {
        newBlockElement.focus();
        newBlockElement.setSelectionRange(0, 0);
      }
    }, 10);
  };

  // Handle key press in the input field
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const text = input.value;
    
    // Handle slash command
    if (e.key === '/' && text === '') {
      e.preventDefault();
      updateCommandMenuPosition('input');
      setShowCommandMenu(true);
      return;
    }

    // Close command menu on escape
    if (e.key === 'Escape' && showCommandMenu) {
      e.preventDefault();
      setShowCommandMenu(false);
      return;
    }

    // Enter to create block
    if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
      e.preventDefault();
      
      // Don't create new block if command menu is open
      if (showCommandMenu) {
        return;
      }
      
      // Check if content starts with "[ ] " or "[] " to create a task
      const isTask = /^\[[ x]?\]\s/.test(text.trim());
      const cleanContent = text.trim().replace(/^\[[ x]?\]\s/, '');
      
      // Create a new block with the current content
      const newBlock: BlockType = { 
        id: `block-${Date.now()}`, 
        type: isTask ? 'task' : 'text', 
        content: cleanContent, 
        priority: '',
        tags: [],
        collapsed: false,
        children: [],
        checked: false
      };
      
      // Add the new block to the list
      updateBlocks([...blocks, newBlock]);
      
      // Clear the input
      input.value = '';
    }
  };

  // Handle empty block key events
  const handleEmptyBlockKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';
    
    // Handle slash command
    if (e.key === '/' && text === '') {
      e.preventDefault();
      updateCommandMenuPosition('empty-block');
      setShowCommandMenu(true);
      return;
    }

    // Close command menu on escape
    if (e.key === 'Escape' && showCommandMenu) {
      e.preventDefault();
      setShowCommandMenu(false);
      return;
    }

    // Convert empty block to a real block on enter
    if (e.key === 'Enter' && !e.shiftKey && emptyBlockContent.trim()) {
      e.preventDefault();
      
      // Check if content starts with "[ ] " or "[] " to create a task
      const isTask = /^\[[ x]?\]\s/.test(emptyBlockContent.trim());
      const cleanContent = emptyBlockContent.trim().replace(/^\[[ x]?\]\s/, '');
      
      // Create a new block with the current content
      const newBlock: BlockType = { 
        id: `block-${Date.now()}`, 
        type: isTask ? 'task' : 'text', 
        content: cleanContent, 
        priority: '',
        tags: [],
        collapsed: false,
        children: [],
        checked: false
      };
      
      // Add the new block to the list
      updateBlocks([...blocks, newBlock]);
      
      // Clear the empty block
      setEmptyBlockContent('');
      
      // Focus the empty block again for continuous typing
      setTimeout(() => {
        if (emptyBlockRef.current) {
          emptyBlockRef.current.textContent = '';
          emptyBlockRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div 
      ref={editorRef} 
      className="block-editor w-full h-full px-8 py-6 flex flex-col min-h-0 flex-grow bg-white"
    >
      {/* Task Input Field */}
      <div className="mb-6 flex-shrink-0 relative">
        <div className="w-full flex border border-gray-300 rounded-md overflow-hidden">
          <input 
            ref={inputRef}
            id="task-input"
            type="text" 
            placeholder="Add a new block..." 
            className="flex-1 p-4 bg-white text-gray-800 focus:outline-none border-0 h-[50px]"
            onKeyDown={handleInputKeyDown}
          />
          <button 
            className="bg-gray-100 px-8 font-medium hover:bg-gray-200 transition-colors h-[50px] text-gray-600"
            onClick={handleAddTask}
          >
            Add
          </button>
        </div>

        {/* Command Menu */}
        {showCommandMenu && commandMenuAnchor && (
          <BlockCommandMenu
            isOpen={showCommandMenu}
            anchorEl={commandMenuAnchor}
            onSelect={handleCommandSelect}
            onClose={() => setShowCommandMenu(false)}
          />
        )}
      </div>
      
      {/* Horizontal separator line */}
      <div className="border-t border-gray-200 mb-6 flex-shrink-0"></div>
      
      {/* Task List */}
      <div className="space-y-0 flex-grow flex flex-col min-h-0">
        {blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            <Block block={block} index={index} />
            {index < blocks.length - 1 && (
              <div className="mx-2 h-[1px] bg-gray-100"></div>
            )}
          </React.Fragment>
        ))}
        
        {blocks.length > 0 && (
          <div className="mx-2 h-[1px] bg-gray-100"></div>
        )}
        
        {/* Empty editable block at the bottom */}
        <div className="block-item flex items-start py-2 px-3 rounded transition-colors">
          <div
            ref={emptyBlockRef}
            className="flex-grow outline-none content-input min-h-[28px] text-base font-medium text-gray-400 empty-block"
            contentEditable
            suppressContentEditableWarning
            onInput={handleEmptyBlockChange}
            onKeyDown={handleEmptyBlockKeyDown}
            role="textbox"
            tabIndex={0}
            data-placeholder="Type something..."
          />
        </div>

        {/* Clickable area that fills remaining space */}
        <div 
          className="flex-grow min-h-[400px] cursor-text"
          onClick={(e) => {
            if (emptyBlockRef.current) {
              emptyBlockRef.current.focus();
            }
          }}
        />
      </div>
    </div>
  );
};

export default BlockEditor;
