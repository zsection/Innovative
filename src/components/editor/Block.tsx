import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Calendar, Hash, CheckSquare, Square, List, ListOrdered, Heading1, Heading2, Heading3, Search, Check, ChevronRight, AlertCircle, Minus, Grip } from 'lucide-react';
import { type Block, BlockType, PriorityLevel } from '../../utils/types';
import { processBlockInput, extractMetadata } from '../../utils/blockUtils';
import { useAppContext } from '../../store/store';
import BlockCommandMenu from './BlockCommandMenu';
import QueryBlock from './QueryBlock';

interface BlockProps {
  block: Block;
  index: number;
}

// Function to clean content by removing metadata markers
const getDisplayContent = (content: string): string => {
  // First, replace all metadata markers
  let cleaned = content
    .replace(/\s*!p[1-4]\b\s*/gi, ' ') // Hide priority markers with surrounding spaces
    .replace(/\s*\^(today|tomorrow|upcoming)\b\s*/gi, ' ') // Hide date markers with surrounding spaces
    .replace(/\s*#([a-z0-9_-]+)\b\s*/gi, ' '); // Hide tag markers with surrounding spaces
  
  // Split by newlines and process each line separately to preserve newlines
  const lines = cleaned.split('\n');
  
  // Process each line to normalize spaces within lines only
  const processedLines = lines.map(line => {
    return line.replace(/\s+/g, ' ').trim();
  });
  
  // Join back with newlines and trim the result
  return processedLines.join('\n').trim();
};

const Block: React.FC<BlockProps> = ({ block, index }) => {
  const { 
    state, 
    blocks,
    updateBlocks,
    toggleBlockCheck,
    handleIndent,
    setDraggedBlock,
    setDragOverBlock,
    handleBlockDrop,
    handleMultiBlockDrop,
    toggleBlockSelection,
    clearBlockSelection,
    selectAllBlocks
  } = useAppContext();
  
  const { dragOverBlock, indentations, selectedBlockIds, isMultiSelectActive } = state;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for slash command menu
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] = useState<HTMLElement | null>(null);
  const [slashPosition, setSlashPosition] = useState<number | null>(null);
  
  // State for tag menu
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  
  // State to track live metadata while typing
  const [liveMetadata, setLiveMetadata] = useState({ 
    priority: block.priority || '', 
    date: block.date || undefined, 
    tags: block.tags || [] 
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Create a display version of content without metadata markers
  const [displayContent, setDisplayContent] = useState(getDisplayContent(block.content));
  
  // Auto-resize the textarea when content changes
  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [block.content]);
  
  // Auto-focus and edit new empty blocks
  useEffect(() => {
    if (block.content === '' && inputRef.current) {
      setIsEditing(true);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [block.id]);
  
  // Calculate position for the command menu
  const updateCommandMenuPosition = () => {
    const input = inputRef.current;
    if (!input) return;
    
    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.font = window.getComputedStyle(input).font;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    
    // Get the text before the cursor
    const cursorPosition = input.selectionStart || 0;
    const textBeforeCursor = input.value.substring(0, cursorPosition);
    
    // Measure the width
    span.textContent = textBeforeCursor;
    document.body.appendChild(span);
    const textWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    
    // Create and position the menu anchor
    const rect = input.getBoundingClientRect();
    const anchorElement = document.createElement('div');
    anchorElement.style.position = 'fixed';
    anchorElement.style.left = `${rect.left + textWidth}px`;
    anchorElement.style.top = `${rect.top}px`;
    anchorElement.style.height = `${rect.height}px`;
    
    setCommandMenuAnchor(anchorElement);
  };
  
  // Handle key press in blocks
  const handleKeyDown = (e: React.KeyboardEvent, blockId: string, index: number) => {
    const input = e.target as HTMLTextAreaElement;
    const cursorPosition = input.selectionStart || 0;
    const textBeforeCursor = input.value.substring(0, cursorPosition);
    
    // Check for slash command - only trigger if at start of line or after a newline
    if (e.key === '/' && (textBeforeCursor === '' || textBeforeCursor.endsWith('\n'))) {
      e.preventDefault();
      setSlashPosition(cursorPosition);
      updateCommandMenuPosition();
      setShowCommandMenu(true);
      return;
    }
    
    // Close command menu on escape
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showCommandMenu) {
        setShowCommandMenu(false);
      }
      return;
    }
    
    // Handle command menu navigation
    if (showCommandMenu) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor movement while menu is open
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent new block creation while menu is open
        return;
      }
    }
    
    // Tab for indentation
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      handleIndent(blockId, true);
      return;
    }
    
    // Shift+Tab for outdentation
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      handleIndent(blockId, false);
      return;
    }
    
    // Enter creates a new block when not holding shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Don't create new block if command menu is open
      if (showCommandMenu) {
        return;
      }
      
      // Inherit indentation level from current block
      const currentIndent = indentations[blockId] || 0;
      
      // Create new block with inherited type for tasks
      const newBlock: Block = { 
        id: `block-${Date.now()}`, 
        type: block.type === 'task' ? 'task' : 'text', // Inherit task type
        content: '', 
        priority: '',
        tags: [],
        collapsed: false,
        children: [],
        checked: false // Initialize as unchecked for tasks
      };
      
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      updateBlocks(newBlocks);
      
      // Set indentation for new block
      handleIndent(newBlock.id, false); // Reset to 0
      for (let i = 0; i < currentIndent; i++) {
        handleIndent(newBlock.id, true); // Increase to match the current block
      }
    }
    
    // Backspace on empty block deletes it and moves cursor up
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      
      const newBlocks = blocks.filter((_, i) => i !== index);
      updateBlocks(newBlocks);
      
      // Focus previous block - will be handled by useEffect in the next render
    }
    
    // Arrow up/down for navigation
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevBlock = blocks[index - 1];
      document.getElementById(`block-${prevBlock.id}`)?.focus();
    }
    
    if (e.key === 'ArrowDown' && index < blocks.length - 1) {
      e.preventDefault();
      const nextBlock = blocks[index + 1];
      document.getElementById(`block-${nextBlock.id}`)?.focus();
    }
  };

  // Update command menu position on input click or change
  const handleInputFocus = () => {
    if (showCommandMenu) {
      updateCommandMenuPosition();
    }
  };

  // Handle command menu selection
  const handleCommandSelect = (commandType: string) => {
    let newType: BlockType = 'text';
    let newContent = block.content;
    let newHeadingLevel: 1 | 2 | 3 | undefined = undefined;
    
    // Replace the slash command with the appropriate styling
    if (slashPosition !== null) {
      newContent = newContent.substring(0, slashPosition);
    }
    
    // Set the block type based on the command
    switch (commandType) {
      case 'task':
        newType = 'task';
        break;
      case 'bullet':
        newType = 'bullet';
        break;
      case 'numbered':
        newType = 'numbered';
        break;
      case 'h1':
        newType = 'heading';
        newHeadingLevel = 1;
        break;
      case 'h2':
        newType = 'heading';
        newHeadingLevel = 2;
        break;
      case 'h3':
        newType = 'heading';
        newHeadingLevel = 3;
        break;
      case 'query':
        newType = 'query';
        newContent = 'Custom Query';
        break;
      case 'divider':
        newType = 'divider';
        newContent = '';
        break;
    }
    
    // Create the updated block
    const updatedBlock = {
      ...block,
      type: newType,
      content: newContent,
      headingLevel: newHeadingLevel,
    };
    
    // Update the block in the state
    const newBlocks = blocks.map(b => 
      b.id === block.id ? updatedBlock : b
    );
    
    updateBlocks(newBlocks);
    setShowCommandMenu(false);
    
    // Focus the block again after update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Update query block
  const handleQueryBlockUpdate = (updatedBlock: Block) => {
    const newBlocks = blocks.map(b => 
      b.id === updatedBlock.id ? updatedBlock : b
    );
    updateBlocks(newBlocks);
  };

  // Get left padding based on indentation level
  const getLeftPadding = () => {
    const level = indentations[block.id] || 0;
    // First level has no padding, subsequent levels add 20px each
    return level === 0 ? '0px' : `${level * 20}px`;
  };
  
  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBlockCheck(block.id);
  };
  
  // Handle outside clicks for tag menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(event.target as Node)) {
        setShowPriorityMenu(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setShowDateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle tag menu
  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTagMenu(!showTagMenu);
    setShowPriorityMenu(false);
    setShowDateMenu(false);
  };

  // Toggle priority menu
  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPriorityMenu(!showPriorityMenu);
    setShowTagMenu(false);
    setShowDateMenu(false);
  };

  // Toggle date menu
  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDateMenu(!showDateMenu);
    setShowTagMenu(false);
    setShowPriorityMenu(false);
  };

  // Add tag to block
  const addTag = (tag: string) => {
    const newBlocks = blocks.map(b => {
      if (b.id === block.id) {
        const newTags = b.tags.includes(tag) 
          ? b.tags.filter(t => t !== tag) // Remove if already exists
          : [...b.tags, tag]; // Add if doesn't exist
        
        return {
          ...b,
          tags: newTags
        };
      }
      return b;
    });
    
    updateBlocks(newBlocks);
    setShowTagMenu(false);
  };

  // Function to update priority
  const setPriority = (priority: PriorityLevel | '') => {
    const newBlocks = blocks.map(b => {
      if (b.id === block.id) {
        return {
          ...b,
          priority: priority as PriorityLevel
        };
      }
      return b;
    });
    
    updateBlocks(newBlocks);
    setShowPriorityMenu(false);
  };

  // Set date for block
  const setDate = (date: string) => {
    const newBlocks = blocks.map(b => {
      if (b.id === block.id) {
        return {
          ...b,
          date: b.date === date ? undefined : date // Toggle date
        };
      }
      return b;
    });
    
    updateBlocks(newBlocks);
    setShowDateMenu(false);
  };

  // Update live metadata whenever content changes
  useEffect(() => {
    if (isEditing) {
      const extracted = extractMetadata(block.content);
      setLiveMetadata(extracted);
    }
  }, [block.content, isEditing]);
  
  // Update display content when actual content or editing state changes
  useEffect(() => {
    if (isEditing) {
      setDisplayContent(block.content); // Show full content with markers when editing
    } else {
      setDisplayContent(getDisplayContent(block.content)); // Clean content when not editing
    }
  }, [block.content, isEditing]);
  
  // Update metadata on blur (when editing stops)
  const handleBlur = () => {
    // First update the display content to prevent visual jump
    setDisplayContent(getDisplayContent(block.content));
    
    // Then exit edit mode
    setIsEditing(false);
    
    // Update block with extracted metadata if needed
    if (liveMetadata.priority || liveMetadata.date || liveMetadata.tags.length > 0) {
      const newBlocks = blocks.map(b => {
        if (b.id === block.id) {
          return {
            ...b,
            priority: liveMetadata.priority as PriorityLevel || b.priority,
            date: liveMetadata.date || b.date,
            tags: liveMetadata.tags.length > 0 ? liveMetadata.tags : b.tags
          };
        }
        return b;
      });
      
      updateBlocks(newBlocks);
    }
  };
  
  // Handle focus
  const handleFocus = () => {
    setIsEditing(true);
    handleInputFocus();
    
    // Show original content with metadata markers
    setDisplayContent(block.content);
    
    // After a short delay, select cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const textarea = inputRef.current;
        // Preserve cursor position if applicable
        const cursorPos = textarea.selectionStart || 0;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };
  
  // Handle mouse selection with keyboard modifiers
  const handleBlockClick = (e: React.MouseEvent) => {
    // Only handle selection if not clicking on the checkbox or metadata items
    if ((e.target as HTMLElement).closest('.task-checkbox, .metadata-item')) {
      return;
    }
    
    // If ctrl/cmd key is pressed, toggle this block in selection
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      toggleBlockSelection(block.id);
    } 
    // If shift key is pressed, select range
    else if (e.shiftKey) {
      e.preventDefault();
      toggleBlockSelection(block.id, true);
    } 
    // If this block is already selected and we have multiple selections, maintain selection
    else if (selectedBlockIds.includes(block.id) && selectedBlockIds.length > 1) {
      // Don't clear selection, let user click again to focus just this block
    } 
    // Normal click - clear selection and focus this block
    else if (selectedBlockIds.length > 0) {
      clearBlockSelection();
    }
  };
  
  // Handle drag handle click with modifiers for selection
  const handleDragHandleClick = (e: React.MouseEvent) => {
    // If ctrl/cmd or shift key is pressed, handle selection
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleBlockSelection(block.id);
    } else if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleBlockSelection(block.id, true);
    } else if (!selectedBlockIds.includes(block.id)) {
      // Single click on unselected block's handle - select just this block
      clearBlockSelection();
      toggleBlockSelection(block.id);
    }
  };

  // Keyboard shortcut handler for selection and actions
  const handleSelectionKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd+A to select all blocks
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      selectAllBlocks();
    }
    
    // Escape to clear selection
    if (e.key === 'Escape' && selectedBlockIds.length > 0) {
      e.preventDefault();
      clearBlockSelection();
    }
  };

  // Add event listeners for keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleSelectionKeyDown as any);
    return () => {
      window.removeEventListener('keydown', handleSelectionKeyDown as any);
    };
  }, [blocks, selectedBlockIds]);
  
  // Handle block content with multi-selection support
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Don't process in multi-select mode
    if (isMultiSelectActive && selectedBlockIds.length > 1) return;
    
    const newContent = e.target.value;
    processBlockInput(newContent, block.id, blocks, updateBlocks, false);
    
    // Extract metadata for visual display without modifying content
    const extracted = extractMetadata(newContent);
    setLiveMetadata(extracted);
    
    // Update display content when editing (show markers while editing)
    setDisplayContent(newContent);
  };
  
  // Render tags if they exist
  const renderTags = () => {
    const tagsToShow = isEditing ? liveMetadata.tags : block.tags;
    if (!tagsToShow || tagsToShow.length === 0) return null;
    
    // Show at most 1 tag by default, with a count indicator if there are more
    const hasMoreTags = tagsToShow.length > 1;
    
    return (
      <div className="relative group/tags">
        <span className="tag-badge">
          <span className="text-emerald-600">#</span>{tagsToShow[0]}
          {hasMoreTags && (
            <span className="ml-1 text-gray-400">+{tagsToShow.length - 1}</span>
          )}
        </span>
        
        {/* Show all tags on hover */}
        {hasMoreTags && (
          <div className="absolute right-0 top-full mt-1 invisible group-hover/tags:visible bg-white shadow-sm rounded-md border border-gray-200 p-2 w-auto z-10 whitespace-nowrap flex flex-col items-end">
            {tagsToShow.map((tag) => (
              <span key={tag} className="tag-badge mr-0 mb-1.5 last:mb-0">
                <span className="text-emerald-600">#</span>{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render priority if it exists (from block or live typing)
  const renderPriority = () => {
    const priorityToShow = isEditing ? liveMetadata.priority : block.priority;
    if (!priorityToShow) return null;
    
    // Use a flag icon instead of text for priority
    const priorityClass = `priority-badge priority-${priorityToShow.toLowerCase()}`;
    return (
      <span className={priorityClass}>
        <span>⚑</span>
      </span>
    );
  };

  // Render date if it exists (from block or live typing)
  const renderDate = () => {
    const dateToShow = isEditing ? liveMetadata.date : block.date;
    if (!dateToShow) return null;
    
    // Format the date in a more minimal style
    let displayDate = dateToShow;
    let dateClass = "date-badge";
    
    // Color-code based on proximity
    if (dateToShow === 'today') {
      dateClass += " date-today"; // Today is highlighted differently
    } else if (dateToShow === 'tomorrow') {
      dateClass += " date-tomorrow"; // Tomorrow gets a different color
    } else if (dateToShow === 'upcoming') {
      dateClass += " date-upcoming"; // Future dates
    }
    
    // Shorter display format
    if (dateToShow === 'today') {
      displayDate = 'today';
    } else if (dateToShow === 'tomorrow') {
      displayDate = 'tmrw';
    } else if (dateToShow === 'upcoming') {
      displayDate = 'soon';
    }
    
    return (
      <span className={dateClass}>
        {displayDate}
      </span>
    );
  };

  // Function to render block content with the correct styling
  const renderBlockContent = () => {
    // For block types that have custom rendering
    if (block.type === 'divider') {
      return (
        <div className="divider-block"></div>
      );
    }
    
    if (block.type === 'query') {
      return (
        <QueryBlock block={block} onUpdate={handleQueryBlockUpdate} />
      );
    }
    
    // For remaining block types, render the standard content
    return (
      <div className="block-content group flex items-center">
        {/* Only render the block type icon here, don't duplicate it elsewhere */}
        {renderBlockTypeIcon()}
        
        <div className="flex-1 relative">
          {/* When editing, show the textarea */}
          {isEditing ? (
            <div className="content-wrapper">
              {/* Keep a hidden div with same content to maintain height */}
              <div 
                className="content-display invisible"
                aria-hidden="true"
              >
                {displayContent}
              </div>
              
              <textarea
                ref={inputRef}
                id={`block-${block.id}`}
                className="content-input"
                value={block.content}
                onChange={handleContentChange}
                onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                onFocus={handleInputFocus}
                onClick={handleInputFocus}
                onBlur={handleBlur}
                autoFocus
              />
            </div>
          ) : (
            // When not editing, show the formatted content
            <div 
              className={`content-display ${block.type === 'task' && block.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
              onClick={handleTextClick}
            >
              {displayContent}
            </div>
          )}
        </div>
        
        {/* Metadata display */}
        {!isEditing && (block.priority || block.date || (block.tags && block.tags.length > 0)) && (
          <div className="flex items-center gap-2 ml-auto metadata-display">
            {renderTags()}
            {renderPriority()}
            {renderDate()}
          </div>
        )}
      </div>
    );
  };
  
  // Render block type icon
  const renderBlockTypeIcon = () => {
    if (block.type === 'query') {
      return (
        <div className="block-type-icon mr-3 flex-shrink-0">
          <Search size={18} className="text-gray-400" />
        </div>
      );
    }
    
    if (block.type === 'task') {
      return (
        <div 
          className="task-checkbox mr-3 flex-shrink-0 cursor-pointer"
          onClick={handleCheckboxClick}
        >
          {block.checked ? (
            <CheckSquare size={18} className="text-blue-500" />
          ) : (
            <Square size={18} className="text-gray-400" />
          )}
        </div>
      );
    }
    
    if (block.type === 'bullet') {
      return (
        <div className="block-type-icon mr-3 flex-shrink-0">
          <List size={18} className="text-gray-400" />
        </div>
      );
    }
    
    if (block.type === 'numbered') {
      return (
        <div className="block-type-icon mr-3 flex-shrink-0">
          <ListOrdered size={18} className="text-gray-400" />
        </div>
      );
    }
    
    if (block.type === 'heading') {
      if (block.headingLevel === 1) {
        return (
          <div className="block-type-icon mr-3 flex-shrink-0">
            <Heading1 size={18} className="text-gray-400" />
          </div>
        );
      }
      if (block.headingLevel === 2) {
        return (
          <div className="block-type-icon mr-3 flex-shrink-0">
            <Heading2 size={18} className="text-gray-400" />
          </div>
        );
      }
      if (block.headingLevel === 3) {
      return (
          <div className="block-type-icon mr-3 flex-shrink-0">
            <Heading3 size={18} className="text-gray-400" />
        </div>
      );
      }
    }
    
    return (
      <div className="block-type-icon mr-3 flex-shrink-0 w-[18px]"></div>
    );
  };
  
  // Check if the block is selected
  const isSelected = selectedBlockIds.includes(block.id);
  
  // Handle touch events for mobile selection
  const handleTouchStart = (e: React.TouchEvent) => {
    // Record touch start time for long press detection
    setTouchStartTime(Date.now());
    setTouchStartY(e.touches[0].clientY);
    
    // Set up long press timeout (500ms)
    longPressTimeoutRef.current = setTimeout(() => {
      // Long press detected - toggle selection
      toggleBlockSelection(block.id);
      setTouchStartTime(null);
      // Provide haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // 50ms vibration
      }
    }, 500);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // If we're in multi-select mode and the user is scrolling, allow normal scrolling
    if (touchStartY !== null) {
      const moveY = Math.abs(e.touches[0].clientY - touchStartY);
      // If moved more than 10px vertically, cancel the long press
      if (moveY > 10) {
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    // Clear the long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    
    // If this was a quick tap and we're in multi-select mode, toggle selection
    if (touchStartTime && Date.now() - touchStartTime < 300 && isMultiSelectActive) {
      toggleBlockSelection(block.id);
    }
    
    setTouchStartTime(null);
    setTouchStartY(null);
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle text click to start editing
  const handleTextClick = () => {
    // Get the current display content element
    const contentElement = document.querySelector(`#block-${block.id} .content-display`);
    let rect = null;
    if (contentElement) {
      rect = contentElement.getBoundingClientRect();
    }
    
    // Keep the original content while switching
    setDisplayContent(block.content);
    
    // Switch to edit mode
    setIsEditing(true);
    
    // Focus the input after a small delay to ensure the component has rendered
    setTimeout(() => {
      if (inputRef.current) {
        const textarea = inputRef.current;
        
        // Set size before focusing to prevent layout shift
        if (rect) {
          // Pre-set height to match the display element exactly
          textarea.style.height = `${rect.height}px`;
        }
        
        // Focus and set cursor position after setting size
        textarea.focus();
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }, 0);
  };
  
  // Render the regular block's content
  return (
    <div 
      className={`editor-block group ${selectedBlockIds.includes(block.id) ? 'selected-block' : ''}`}
      style={{ paddingLeft: `${(indentations[block.id] || 0) * 24 + 8}px` }}
      onClick={handleBlockClick}
      onKeyDown={handleSelectionKeyDown}
      data-block-id={block.id}
    >
      {/* Block handle */}
      <div 
        className="block-handle group-hover:opacity-100" 
        onMouseDown={(e) => {
          e.preventDefault();
          setDraggedBlock(block.id);
        }}
        onClick={handleDragHandleClick}
      >
        <Grip size={14} />
      </div>
      
      {/* Block type indicator */}
      <div className="flex items-center mt-[2px]">
        {renderBlockTypeIcon()}
      </div>
      
      {/* Block content */}
      <div className="flex-grow min-w-0">
        <div className="relative min-h-[28px] flex items-start">
          <div className="flex-grow min-w-0 relative">
            <div 
              className={`content-display text-base font-medium leading-[1.8] p-0 m-0 ${block.checked ? 'text-gray-400 line-through' : 'text-gray-800'} ${isEditing ? 'invisible' : ''}`}
              onClick={() => setIsEditing(true)}
              style={{ 
                minHeight: '28px', 
                paddingTop: '2px',
                position: 'relative',
                top: '0',
                left: '0'
              }}
            >
              {displayContent || <span className="text-gray-400">Empty block</span>}
            </div>
            {isEditing || block.content === '' ? (
              <textarea
                ref={inputRef}
                id={`block-${block.id}`}
                value={block.content}
                onChange={handleContentChange}
                onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onClick={handleTextClick}
                className="w-full bg-transparent resize-none outline-none content-input text-base font-medium text-gray-800 p-0 m-0 border-0 leading-[1.8] block absolute inset-0"
                style={{
                  minHeight: '28px',
                  height: '100%',
                  display: 'block',
                  overflow: 'hidden',
                  paddingTop: '2px',
                  position: 'absolute',
                  top: '0',
                  left: '0'
                }}
                rows={1}
                autoFocus
              />
            ) : null}
          </div>

          {/* Metadata badges */}
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {renderPriority()}
            {renderDate()}
            {renderTags()}
          </div>
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
    </div>
  );
};

export default Block;
