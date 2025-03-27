
import React, { useState, useEffect, useRef } from 'react';
import { Search, GripVertical, CheckSquare, Square, Edit, Save } from 'lucide-react';
import { Block, QueryCriteria, BlockType, PriorityLevel } from '../../utils/types';
import { useAppContext } from '../../store/store';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queryBlockResults } from '../../utils/blockUtils';

interface QueryBlockProps {
  block: Block;
  onUpdate: (updatedBlock: Block) => void;
}

const QueryBlock: React.FC<QueryBlockProps> = ({ block, onUpdate }) => {
  const { state, setDraggedBlock, setDragOverBlock, updateQueryBlockOrder } = useAppContext();
  const { allBlocks, projects, tagCollection, queryBlockOrders } = state;
  
  // State for query results
  const [results, setResults] = useState<Block[]>([]);
  // State for local order to allow reordering
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  // State for query criteria
  const [queryCriteria, setQueryCriteria] = useState<QueryCriteria>(
    block.query || { blockTypes: [], priorities: [], tags: [], dates: [] }
  );
  // State for query options
  const [queryTitle, setQueryTitle] = useState<string>(block.content || 'Custom Query');
  const [showTitle, setShowTitle] = useState<boolean>(block.showTitle !== false);
  const [bgColor, setBgColor] = useState<string>(block.bgColor || 'bg-swiss-lightGray/80');
  
  // State for edit button visibility
  const [isHovering, setIsHovering] = useState(false);

  // All available dates for filtering
  const allDates = ['today', 'tomorrow', 'upcoming', 'no date'];
  // All available block types for filtering
  const allBlockTypes: BlockType[] = ['text', 'task', 'bullet', 'numbered', 'heading'];
  // All available priorities for filtering
  const allPriorities: PriorityLevel[] = ['P1', 'P2', 'P3', 'P4', ''];
  // All available background colors
  const bgColors = [
    { name: 'Transparent', value: 'bg-transparent' },
    { name: 'Light Gray', value: 'bg-swiss-lightGray/80' },
    { name: 'Blue', value: 'bg-blue-50' },
    { name: 'Green', value: 'bg-green-50' },
    { name: 'Yellow', value: 'bg-yellow-50' },
    { name: 'Purple', value: 'bg-purple-50' },
    { name: 'Pink', value: 'bg-pink-50' },
    { name: 'Orange', value: 'bg-orange-50' },
    { name: 'Red', value: 'bg-red-50' },
    { name: 'Teal', value: 'bg-teal-50' },
    { name: 'Indigo', value: 'bg-indigo-50' },
  ];

  // Update results when query changes
  useEffect(() => {
    if (block.query) {
      const queryResults = queryBlockResults(block.query, allBlocks);
      setResults(queryResults);
      
      // Initialize local order if we have a saved order
      if (queryBlockOrders[block.id]) {
        setLocalOrder(queryBlockOrders[block.id]);
      } else {
        // Otherwise use the natural order of query results
        setLocalOrder(queryResults.map(result => result.id));
      }
    }
  }, [block.query, allBlocks, queryBlockOrders, block.id]);

  // Sync component state with block props
  useEffect(() => {
    setQueryTitle(block.content || 'Custom Query');
    setShowTitle(block.showTitle !== false); // Default to true if not specified
    setBgColor(block.bgColor || 'bg-swiss-lightGray/80');
  }, [block]);

  // Get source project name
  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || projectId;
  };

  // Handle toggle check on a task
  const handleToggleCheck = (resultBlock: Block) => {
    if (resultBlock._sourceProject) {
      // We'll use the store's toggleBlockCheck function which is passed from parent
      // and handles source project updates
      const updatedResults = results.map(item => 
        item.id === resultBlock.id 
          ? { ...item, checked: !item.checked } 
          : item
      );
      setResults(updatedResults);
      
      // The actual toggle will be handled by the store
    }
  };

  // Handle drag & drop for query results
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    e.stopPropagation(); // Prevent parent handlers from firing
    setDraggedBlock(blockId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent handlers from firing
    setDragOverBlock(blockId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent handlers from firing
    
    if (state.draggedBlock && state.dragOverBlock) {
      // Reorder the items locally
      const draggedIndex = localOrder.findIndex(id => id === state.draggedBlock);
      const dropIndex = localOrder.findIndex(id => id === state.dragOverBlock);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newOrder = [...localOrder];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, removed);
        
        // Update local state
        setLocalOrder(newOrder);
        
        // Update the store with the new order
        updateQueryBlockOrder(block.id, newOrder);
      }
    }
    
    setDraggedBlock(null);
    setDragOverBlock(null);
  };

  // Save updated query criteria and options
  const saveQueryCriteria = () => {
    // Update the block with new query criteria and options
    onUpdate({
      ...block,
      content: queryTitle,
      query: queryCriteria,
      showTitle: showTitle,
      bgColor: bgColor
    });
    setIsEditing(false);
  };

  // Toggle block types in query criteria
  const toggleBlockType = (type: BlockType) => {
    setQueryCriteria(prev => {
      const types = prev.blockTypes || [];
      if (types.includes(type)) {
        return { ...prev, blockTypes: types.filter(t => t !== type) };
      } else {
        return { ...prev, blockTypes: [...types, type] };
      }
    });
  };

  // Toggle priorities in query criteria
  const togglePriority = (priority: PriorityLevel) => {
    setQueryCriteria(prev => {
      const priorities = prev.priorities || [];
      if (priorities.includes(priority)) {
        return { ...prev, priorities: priorities.filter(p => p !== priority) };
      } else {
        return { ...prev, priorities: [...priorities, priority] };
      }
    });
  };

  // Toggle tags in query criteria
  const toggleTag = (tag: string) => {
    setQueryCriteria(prev => {
      const tags = prev.tags || [];
      if (tags.includes(tag)) {
        return { ...prev, tags: tags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...tags, tag] };
      }
    });
  };

  // Toggle dates in query criteria
  const toggleDate = (date: string) => {
    setQueryCriteria(prev => {
      const dates = prev.dates || [];
      if (dates.includes(date)) {
        return { ...prev, dates: dates.filter(d => d !== date) };
      } else {
        return { ...prev, dates: [...dates, date] };
      }
    });
  };

  // Render the query editor
  const renderQueryEditor = () => {
    return (
      <div className={`query-editor ${bgColor} p-4 rounded-sm border border-swiss-midGray/10`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Edit Query</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveQueryCriteria}
            className="flex items-center gap-1"
          >
            <Save size={14} />
            <span>Save</span>
          </Button>
        </div>
        
        {/* Query Options */}
        <div className="mb-4 p-3 bg-white/50 rounded-sm">
          <h4 className="font-medium text-sm mb-2">Query Options</h4>
          
          <div className="mb-3">
            <label className="text-sm block mb-1">Query Title</label>
            <Input 
              type="text"
              value={queryTitle}
              onChange={(e) => setQueryTitle(e.target.value)}
              placeholder="Enter query title"
              className="h-8 text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox 
              id="show-title"
              checked={showTitle}
              onCheckedChange={(checked) => setShowTitle(!!checked)}
            />
            <label 
              htmlFor="show-title"
              className="text-sm cursor-pointer"
            >
              Show title
            </label>
          </div>
          
          <div className="mb-3">
            <label className="text-sm block mb-1">Background Color</label>
            <Select 
              value={bgColor}
              onValueChange={(value) => setBgColor(value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select background color" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {bgColors.map(color => (
                    <SelectItem 
                      key={color.value} 
                      value={color.value}
                      className="flex items-center"
                    >
                      <div className={`w-4 h-4 rounded-sm mr-2 ${color.value}`}></div>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Block Types */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Block Types</h4>
          <div className="flex flex-wrap gap-2">
            {allBlockTypes.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox 
                  id={`type-${type}`} 
                  checked={(queryCriteria.blockTypes || []).includes(type)}
                  onCheckedChange={() => toggleBlockType(type)}
                />
                <label 
                  htmlFor={`type-${type}`}
                  className="text-sm cursor-pointer"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Priorities */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Priorities</h4>
          <div className="flex flex-wrap gap-2">
            {allPriorities.map(priority => (
              <div key={priority || 'none'} className="flex items-center space-x-2">
                <Checkbox 
                  id={`priority-${priority || 'none'}`} 
                  checked={(queryCriteria.priorities || []).includes(priority)}
                  onCheckedChange={() => togglePriority(priority)}
                />
                <label 
                  htmlFor={`priority-${priority || 'none'}`}
                  className="text-sm cursor-pointer"
                >
                  {priority || 'No Priority'}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tagCollection.map(tag => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox 
                  id={`tag-${tag}`} 
                  checked={(queryCriteria.tags || []).includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                />
                <label 
                  htmlFor={`tag-${tag}`}
                  className="text-sm cursor-pointer"
                >
                  #{tag}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Dates */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Dates</h4>
          <div className="flex flex-wrap gap-2">
            {allDates.map(date => (
              <div key={date} className="flex items-center space-x-2">
                <Checkbox 
                  id={`date-${date}`} 
                  checked={(queryCriteria.dates || []).includes(date)}
                  onCheckedChange={() => toggleDate(date)}
                />
                <label 
                  htmlFor={`date-${date}`}
                  className="text-sm cursor-pointer"
                >
                  {date.charAt(0).toUpperCase() + date.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render query results like the Today list
  const renderQueryResults = () => {
    const orderedResults = localOrder
      .map(id => results.find(result => result.id === id))
      .filter(Boolean) as Block[];
    
    return (
      <div 
        className={`query-results ${bgColor} p-4 rounded-sm border border-swiss-midGray/10`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
      >
        {showTitle && (
          <div className="flex justify-between items-center mb-3 pb-1 border-b border-swiss-midGray/10">
            <div className="flex items-center">
              <span className="tag-badge bg-swiss-blue/10 text-swiss-blue mr-2">Query</span>
              <h3 className="text-lg font-medium">
                {block.content || 'Custom Query'}
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-1 ${isHovering ? 'opacity-100' : 'opacity-0'} transition-opacity`}
            >
              <Edit size={14} />
              <span>Edit</span>
            </Button>
          </div>
        )}
        
        {/* Remove filter criteria pills as requested */}
        
        <div className="query-section-content">
          {orderedResults.length > 0 ? (
            orderedResults.map((result) => (
              <div 
                key={result.id}
                draggable
                onDragStart={(e) => handleDragStart(e, result.id)}
                onDragOver={(e) => handleDragOver(e, result.id)}
                onDrop={handleDrop}
                className={`flex items-center py-1.5 px-1 rounded-sm hover:bg-black/[0.02] group transition-colors ${
                  state.dragOverBlock === result.id ? 'bg-black/[0.04]' : ''
                }`}
              >
                <div className="drag-handle opacity-0 group-hover:opacity-100 mr-1 cursor-grab">
                  <GripVertical size={14} className="text-swiss-midGray" />
                </div>
                
                {/* Show checkbox for task type blocks */}
                {result.type === 'task' && (
                  <div 
                    className="mr-3 flex-shrink-0 cursor-pointer" 
                    onClick={() => handleToggleCheck(result)}
                  >
                    {result.checked ? (
                      <CheckSquare size={16} className="text-swiss-black" />
                    ) : (
                      <Square size={16} className="text-swiss-midGray" />
                    )}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className={`text-[15px] leading-snug ${
                    result.type === 'task' && result.checked ? 'line-through text-swiss-midGray' : ''
                  }`}>
                    {result.content}
                  </div>
                  
                  <div className="text-xs text-swiss-midGray mt-0.5">
                    {result._sourceProject && getProjectName(result._sourceProject)}
                    {result.priority && <span className="ml-2">{result.priority}</span>}
                    {result.date && <span className="ml-2">^{result.date}</span>}
                    {result.tags && result.tags.map(tag => (
                      <span key={tag} className="ml-1">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-results py-2 text-swiss-midGray text-sm">
              No matching blocks found. Try changing your query criteria.
            </div>
          )}
        </div>
        
        {/* Show edit button on hover when there's no title */}
        {!showTitle && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className={`flex items-center gap-1 mt-2 ${isHovering ? 'opacity-100' : 'opacity-0'} transition-opacity float-right`}
          >
            <Edit size={14} />
            <span>Edit</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="query-block mb-4">
      {isEditing ? renderQueryEditor() : renderQueryResults()}
    </div>
  );
};

export default QueryBlock;
