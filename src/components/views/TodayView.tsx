import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/store';
import BlockEditor from '../editor/BlockEditor';
import { CheckSquare, Square, GripVertical } from 'lucide-react';

const TodayView: React.FC = () => {
  const { state, toggleBlockCheck, setDraggedBlock, setDragOverBlock, handleBlockDrop } = useAppContext();
  const { allBlocks, projects } = state;
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  
  // Get all tasks that have "^today" in their content or date === 'today'
  const getTodayTasks = () => {
    const todayTasks: any[] = [];
    
    // Search all projects for tasks with "^today"
    Object.entries(allBlocks).forEach(([projectId, projectBlocks]) => {
      projectBlocks.forEach(block => {
        if (block.type === 'task' && (
            (block.content && block.content.toLowerCase().includes('^today')) ||
            block.date === 'today'
          )) {
          todayTasks.push({
            ...block,
            _sourceProject: projectId
          });
        }
      });
    });
    
    // Apply local ordering if available
    if (localOrder.length > 0) {
      // First add blocks in the local order
      const orderedTasks: any[] = [];
      const remainingTasks = [...todayTasks];
      
      localOrder.forEach(id => {
        const taskIndex = remainingTasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
          orderedTasks.push(remainingTasks[taskIndex]);
          remainingTasks.splice(taskIndex, 1);
        }
      });
      
      // Then add any new tasks that weren't in the order
      return [...orderedTasks, ...remainingTasks];
    }
    
    return todayTasks;
  };
  
  const todayTasks = getTodayTasks();
  
  // Track changes in the tasks and update localOrder to include new tasks
  useEffect(() => {
    // Get all task IDs
    const currentTaskIds = todayTasks.map(task => task.id);
    
    // Check if we have new tasks that aren't in the localOrder
    const hasNewTasks = currentTaskIds.some(id => !localOrder.includes(id));
    
    // If we have new tasks or no localOrder yet, update the localOrder
    if (hasNewTasks || localOrder.length === 0) {
      // Keep existing order for already ordered tasks
      const newOrder = [...localOrder];
      
      // Add any new task IDs that aren't already in the order
      currentTaskIds.forEach(id => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      
      // Remove any IDs that no longer exist in the tasks
      const filteredOrder = newOrder.filter(id => currentTaskIds.includes(id));
      
      // Update the local order
      setLocalOrder(filteredOrder);
    }
  }, [todayTasks, localOrder]);
  
  // Get source project name
  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || projectId;
  };
  
  // Get color for project
  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && project.color) {
      return project.color;
    }
    return 'gray';
  };
  
  // Handle checking/unchecking tasks in their source projects
  const handleToggleCheck = (block: any) => {
    if (block._sourceProject) {
      toggleBlockCheck(block.id);
    }
  };
  
  // Handle drag & drop for tasks
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOverBlock(blockId);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (state.draggedBlock && state.dragOverBlock) {
      // Reorder the tasks locally for the Today view
      const draggedIndex = localOrder.findIndex(id => id === state.draggedBlock);
      const dropIndex = localOrder.findIndex(id => id === state.dragOverBlock);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newOrder = [...localOrder];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, removed);
        setLocalOrder(newOrder);
      }
    }
    
    setDraggedBlock(null);
    setDragOverBlock(null);
  };
  
  return (
    <div className="today-view flex flex-col w-full px-6 py-4">
      <div className="max-w-3xl mx-auto w-full">
        {/* Task Input Field */}
        <div className="mb-4">
          <div className="w-full flex">
            <input 
              type="text" 
              placeholder="Add a new task..." 
              className="flex-1 p-4 border border-gray-200 bg-white rounded-l-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button className="bg-gray-200 px-4 rounded-r-md hover:bg-gray-300 transition-colors font-medium">
              Add
            </button>
          </div>
        </div>
        
        {/* Horizontal separator line */}
        <div className="border-t border-gray-200 my-6"></div>
        
        {/* Task Lists */}
        <div className="space-y-4">
          {/* Review monthly budget */}
          <div>
            <div className="mb-2 flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-sm mr-2 flex-shrink-0"></div>
              <h2 className="text-base font-medium">Review monthly budget</h2>
              <span className="ml-2 text-gray-400 text-sm">2</span>
            </div>
            
            <div>
              {todayTasks
                .filter(task => task.content.includes('budget'))
                .map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center py-2.5 group"
                  >
                    <div 
                      className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer"
                      onClick={() => handleToggleCheck(task)}
                    >
                      {task.checked && <div className="w-3 h-3 bg-red-500 rounded-sm"></div>}
                    </div>
                    
                    <div className={`flex-1 ${task.checked ? 'line-through text-gray-400' : ''}`}>
                      {task.content.replace(/\^today|\s!p\d/g, '')}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Finance</span>
                      <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center">
                        <span className="text-xl font-medium">⋯</span>
                      </button>
                    </div>
                  </div>
              ))}
              
              {/* Sample task for demonstration based on the screenshot */}
              <div className="flex items-center py-2.5 group">
                <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer">
                  {/* Empty checkbox */}
                </div>
                
                <div className="flex-1">
                  Update budget spreadsheet
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Finance</span>
                  <span className="text-[11px] text-gray-400">⭐</span>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center">
                    <span className="text-xl font-medium">⋯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Schedule dentist appointment */}
          <div>
            <div className="mb-2 flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-sm mr-2 flex-shrink-0"></div>
              <h2 className="text-base font-medium">Schedule dentist appointment</h2>
            </div>
            
            <div>
              <div className="flex items-center py-2.5 group">
                <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer">
                  {/* Empty checkbox */}
                </div>
                
                <div className="flex-1">
                  Call dentist office to set up cleaning
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Health</span>
                  <span className="text-[11px] text-blue-500">8 days</span>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center">
                    <span className="text-xl font-medium">⋯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pick up dry cleaning */}
          <div>
            <div className="mb-2 flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex-shrink-0"></div>
              <h2 className="text-base font-medium">Pick up dry cleaning</h2>
            </div>
            
            <div>
              <div className="flex items-center py-2.5 group">
                <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer">
                  {/* Empty checkbox */}
                </div>
                
                <div className="flex-1">
                  Stop by cleaners on Main St
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Chores</span>
                  <span className="text-[11px] text-gray-400">⭐</span>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center">
                    <span className="text-xl font-medium">⋯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Buy birthday gift for mom */}
          <div>
            <div className="mb-2 flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-sm mr-2 flex-shrink-0"></div>
              <h2 className="text-base font-medium">Buy birthday gift for mom</h2>
            </div>
            
            <div>
              <div className="flex items-center py-2.5 group">
                <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer">
                  {/* Empty checkbox */}
                </div>
                
                <div className="flex-1">
                  Order flowers and chocolates online
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">Personal</span>
                  <span className="text-[11px] text-blue-500">+1</span>
                  <span className="text-[11px] text-blue-500">4 days</span>
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center">
                    <span className="text-xl font-medium">⋯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayView;
