import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Block, Project, SavedSearch, Section } from '../utils/types';
import { parseContent, getBlocksForSavedSearch, queryBlockResults } from '../utils/blockUtils';

// Initial state for the app
const initialState: AppState = {
  activeView: 'inbox',
  projects: [
    { id: 'inbox', name: 'Inbox', type: 'pinned', icon: 'inbox' },
    { id: 'today', name: 'Today', type: 'pinned', icon: 'calendar' },
    { id: 'work', name: 'Work', type: 'project', color: 'red', sectionId: 'main-projects' },
    { id: 'personal', name: 'Personal', type: 'project', color: 'blue', sectionId: 'main-projects' },
    { 
      id: 'home-improvement', 
      name: 'Home Improvement', 
      type: 'project', 
      color: 'blue', 
      collapsed: false,
      subprojects: [
        { id: 'kitchen-remodel', name: 'Kitchen Remodel', type: 'subproject', color: 'blue' }
      ],
      sectionId: 'main-projects'
    },
    { id: 'fitness-goals', name: 'Fitness Goals', type: 'project', color: 'green', sectionId: 'main-projects' },
    { id: 'learning', name: 'Learning', type: 'project', color: 'purple', sectionId: 'main-projects' },
    { id: 'finance', name: 'Finance', type: 'project', color: 'teal', sectionId: 'main-projects' },
    { id: 'side-projects', name: 'Side Projects', type: 'project', color: 'indigo', sectionId: 'main-projects' },
    { id: 'home', name: 'Home', type: 'project', color: 'red', sectionId: 'home-section' },
  ],
  sections: [
    { id: 'main-projects', name: 'Projects', color: 'blue' },
    { id: 'home-section', name: 'Home', color: 'red' }
  ],
  allBlocks: {
    'inbox': [
      { 
        id: 'block1', 
        type: 'task', 
        checked: false, 
        content: 'Run a mile', 
        priority: '',
        tags: [],
        collapsed: false,
        children: []
      },
      { 
        id: 'block2', 
        type: 'task', 
        checked: false, 
        content: 'Buy a house', 
        priority: '',
        tags: [],
        collapsed: false,
        children: []
      },
      { 
        id: 'block3', 
        type: 'task', 
        checked: false, 
        content: 'Buy one more !p1 ^tomorrow', 
        priority: 'P1',
        date: 'tomorrow',
        tags: [],
        collapsed: false,
        children: []
      },
      { 
        id: 'block4', 
        type: 'task', 
        checked: false, 
        content: 'Testing !p1 ^today', 
        priority: 'P1',
        date: 'today',
        tags: [],
        collapsed: false,
        children: []
      }
    ],
    'work': [
      { 
        id: 'work1', 
        type: 'text', 
        content: 'Work project notes', 
        tags: ['work'],
        collapsed: false,
        children: []
      },
      {
        id: 'work-task1',
        type: 'task',
        checked: false,
        content: 'Finish project proposal ^today',
        priority: '',
        date: 'today',
        tags: ['work'],
        collapsed: false,
        children: []
      }
    ],
    'personal': [
      {
        id: 'personal-task1',
        type: 'task',
        checked: false,
        content: 'Call mom ^today',
        priority: '',
        date: 'today',
        tags: ['personal'],
        collapsed: false,
        children: []
      }
    ],
    'home-improvement': [],
    'kitchen-remodel': [],
    'fitness-goals': [
      {
        id: 'fitness-task1',
        type: 'task',
        checked: false,
        content: 'Go for a jog ^today !p2',
        priority: 'P2',
        date: 'today',
        tags: ['fitness'],
        collapsed: false,
        children: []
      }
    ],
    'learning': [],
    'finance': [],
    'side-projects': [],
    'home': [],
    'today-notes': [
      { 
        id: 'today-note1', 
        type: 'text', 
        content: 'Planning for today', 
        tags: [],
        collapsed: false,
        children: []
      },
      { 
        id: 'today-task1', 
        type: 'task', 
        checked: false,
        content: 'Call dentist for appointment', 
        priority: 'P1',
        tags: ['health'],
        collapsed: false,
        children: []
      }
    ]
  },
  savedSearches: [
    { 
      id: 'high-priority', 
      name: 'High Priority', 
      color: 'purple',
      query: { priority: 'P1' }
    },
    { 
      id: 'health-tasks', 
      name: 'Health Tasks', 
      color: 'orange',
      query: { tags: ['health'] }
    },
    {
      id: 'today-tasks',
      name: 'Today Tasks',
      color: 'blue',
      query: { date: 'today' }
    }
  ],
  savedSearchOrders: {},
  queryBlockOrders: {},
  draggedBlock: null,
  dragOverBlock: null,
  draggedProject: null,
  dragOverProject: null,
  draggedSection: null,
  dragOverSection: null,
  indentations: {},
  commandBarOpen: false,
  commandBarQuery: '',
  tagCollection: ['work', 'personal', 'health', 'fitness'],
  selectedBlockIds: [],
  isMultiSelectActive: false
};

type AppContextType = {
  state: AppState;
  blocks: Block[];
  setActiveView: (viewId: string) => void;
  updateBlocks: (newBlocks: Block[]) => void;
  toggleBlockCheck: (id: string) => void;
  handleIndent: (blockId: string, increase: boolean) => void;
  addBlock: () => void;
  setDraggedBlock: (id: string | null) => void;
  setDragOverBlock: (id: string | null) => void;
  handleBlockDrop: (e: React.DragEvent) => void;
  setDraggedProject: (id: string | null) => void;
  setDragOverProject: (id: string | null) => void;
  handleProjectDrop: (e?: React.DragEvent) => void;
  toggleProjectCollapse: (id: string) => void;
  setCommandBarOpen: (open: boolean) => void;
  setCommandBarQuery: (query: string) => void;
  isInSavedSearch: () => boolean;
  createSavedSearch: (name: string, query: any, color?: string) => void;
  updateQueryBlockOrder: (blockId: string, order: string[]) => void;
  createSection: (name: string, color?: string) => void;
  toggleSectionCollapse: (id: string) => void;
  moveProjectToSection: (projectId: string, sectionId: string) => void;
  setDraggedSection: (id: string | null) => void;
  setDragOverSection: (id: string | null) => void;
  handleSectionDrop: (e: React.DragEvent) => void;
  toggleBlockSelection: (id: string, shiftKey?: boolean) => void;
  selectAllBlocks: () => void;
  clearBlockSelection: () => void;
  handleMultiBlockDrop: (e: React.DragEvent) => void;
  deleteProject: (id: string) => void;
  pinProject: (id: string) => void;
  unpinProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Initialize blocks when active view changes
  useEffect(() => {
    if (state.activeView === 'today') {
      // Special handling for Today view
      const todayBlocks = state.allBlocks['today-notes'] || [];
      setBlocks(todayBlocks);
    } else if (isSavedSearch()) {
      // Get blocks for saved search
      const searchBlocks = getBlocksForSavedSearch(
        state.activeView,
        state.savedSearches,
        state.allBlocks,
        state.savedSearchOrders
      );
      setBlocks(searchBlocks);
    } else {
      // Regular project
      setBlocks(state.allBlocks[state.activeView] || []);
    }
  }, [state.activeView, state.allBlocks, state.savedSearches, state.savedSearchOrders]);

  // Check if current view is a saved search
  const isSavedSearch = () => {
    return state.savedSearches.some(search => search.id === state.activeView);
  };

  // Set active view/project
  const setActiveView = (viewId: string) => {
    setState(prev => ({ ...prev, activeView: viewId }));
  };

  // Update blocks for current view
  const updateBlocks = (newBlocks: Block[]) => {
    // If in a saved search, determine the appropriate update method
    if (isSavedSearch()) {
      // For saved searches, we update the display blocks but need to update source blocks too
      setBlocks(newBlocks);
      
      // Find changed blocks and update them in their source projects
      newBlocks.forEach(block => {
        if (block._sourceProject) {
          const sourceProjectId = block._sourceProject;
          const sourceBlocks = [...(state.allBlocks[sourceProjectId] || [])];
          const blockIndex = sourceBlocks.findIndex(b => b.id === block.id);
          
          if (blockIndex !== -1) {
            // Update the block in its source project
            sourceBlocks[blockIndex] = {
              ...block,
              // Remove the source project metadata to prevent duplication
              _sourceProject: undefined
            };
            
            // Update the source project's blocks
            setState(prev => ({
              ...prev,
              allBlocks: {
                ...prev.allBlocks,
                [sourceProjectId]: sourceBlocks
              }
            }));
          }
        }
      });
    } else if (state.activeView === 'today') {
      // For today view, update the today-notes section
      setBlocks(newBlocks);
      setState(prev => ({
        ...prev,
        allBlocks: {
          ...prev.allBlocks,
          'today-notes': newBlocks
        }
      }));
    } else {
      // For regular projects, just update the blocks
      setBlocks(newBlocks);
      setState(prev => ({
        ...prev,
        allBlocks: {
          ...prev.allBlocks,
          [prev.activeView]: newBlocks
        }
      }));
    }
  };

  // Toggle block checkbox
  const toggleBlockCheck = (id: string) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, checked: !block.checked } : block
    );
    updateBlocks(newBlocks);
  };

  // Handle indentation of blocks
  const handleIndent = (blockId: string, increase: boolean = true) => {
    const currentLevel = state.indentations[blockId] || 0;
    const newLevel = increase ? Math.min(currentLevel + 1, 5) : Math.max(currentLevel - 1, 0);
    
    setState(prev => ({
      ...prev,
      indentations: {
        ...prev.indentations,
        [blockId]: newLevel
      }
    }));
  };

  // Add a new block
  const addBlock = () => {
    // Don't allow adding new blocks directly in saved searches
    if (isSavedSearch()) {
      console.log("Cannot add blocks directly in saved searches");
      return;
    }
    
    const newBlock: Block = { 
      id: `block-${Date.now()}`, 
      type: 'text', 
      content: '', 
      priority: '',
      tags: [],
      collapsed: false,
      children: []
    };
    
    const newBlocks = [...blocks, newBlock];
    updateBlocks(newBlocks);
    
    // Focus will be handled in the component
  };

  // Block drag and drop handlers
  const setDraggedBlock = (id: string | null) => {
    setState(prev => ({ ...prev, draggedBlock: id }));
  };

  const setDragOverBlock = (id: string | null) => {
    setState(prev => ({ ...prev, dragOverBlock: id }));
  };

  const handleBlockDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (state.draggedBlock !== null && state.dragOverBlock !== null) {
      // If in a saved search view, only reorder the display
      if (isSavedSearch()) {
        const draggedIndex = blocks.findIndex(block => block.id === state.draggedBlock);
        const dropIndex = blocks.findIndex(block => block.id === state.dragOverBlock);
        
        if (draggedIndex !== -1 && dropIndex !== -1) {
          // Create a new order array for this saved search if it doesn't exist
          const currentOrder = state.savedSearchOrders[state.activeView] || 
            blocks.map(block => block.id);
          
          // Reorder the IDs
          const newOrder = [...currentOrder];
          const [removed] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(dropIndex, 0, removed);
          
          // Update the saved search order
          setState(prev => ({
            ...prev,
            savedSearchOrders: {
              ...prev.savedSearchOrders,
              [prev.activeView]: newOrder
            }
          }));
          
          // Reorder the current display blocks
          const reorderedBlocks: Block[] = [];
          newOrder.forEach(id => {
            const block = blocks.find(b => b.id === id);
            if (block) reorderedBlocks.push(block);
          });
          
          setBlocks(reorderedBlocks);
        }
      } else {
        // Regular project - update the actual blocks
        const draggedIndex = blocks.findIndex(block => block.id === state.draggedBlock);
        const dropIndex = blocks.findIndex(block => block.id === state.dragOverBlock);
        
        if (draggedIndex !== -1 && dropIndex !== -1) {
          const newBlocks = [...blocks];
          const [removed] = newBlocks.splice(draggedIndex, 1);
          newBlocks.splice(dropIndex, 0, removed);
          updateBlocks(newBlocks);
        }
      }
    }
    
    setDraggedBlock(null);
    setDragOverBlock(null);
  };

  // Project drag and drop handlers
  const setDraggedProject = (id: string | null) => {
    setState(prev => ({ ...prev, draggedProject: id }));
  };

  const setDragOverProject = (id: string | null) => {
    setState(prev => ({ ...prev, dragOverProject: id }));
  };

  const handleProjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (state.draggedProject !== null && state.dragOverProject !== null) {
      // Filter out pinned items from drag and drop
      const draggableProjects = state.projects.filter(p => p.type !== 'pinned');
      const pinnedProjects = state.projects.filter(p => p.type === 'pinned');
      
      const draggedProject = draggableProjects.find(p => p.id === state.draggedProject);
      const targetProject = draggableProjects.find(p => p.id === state.dragOverProject);
      
      if (draggedProject && targetProject) {
        // Only reorder if they're in the same section
        if (draggedProject.sectionId === targetProject.sectionId) {
          const draggedIndex = draggableProjects.findIndex(p => p.id === state.draggedProject);
          const dropIndex = draggableProjects.findIndex(p => p.id === state.dragOverProject);
          
          if (draggedIndex !== -1 && dropIndex !== -1) {
            const newProjects = [...draggableProjects];
            const [removed] = newProjects.splice(draggedIndex, 1);
            newProjects.splice(dropIndex, 0, removed);
            
            // Combine pinned and reordered projects
            setState(prev => ({
              ...prev,
              projects: [...pinnedProjects, ...newProjects]
            }));
          }
        } else {
          // Projects are in different sections, so move it to the target section
          const draggedIndex = draggableProjects.findIndex(p => p.id === state.draggedProject);
          const dropIndex = draggableProjects.findIndex(p => p.id === state.dragOverProject);
          
          if (draggedIndex !== -1 && dropIndex !== -1) {
            const newProjects = [...draggableProjects];
            const [removed] = newProjects.splice(draggedIndex, 1);
            
            // Update the section ID of the dragged project to match the target project's section
            removed.sectionId = targetProject.sectionId;
            
            newProjects.splice(dropIndex, 0, removed);
            
            // Combine pinned and reordered projects
            setState(prev => ({
              ...prev,
              projects: [...pinnedProjects, ...newProjects]
            }));
          }
        }
      }
    }
    
    setDraggedProject(null);
    setDragOverProject(null);
  };

  // Toggle project collapse
  const toggleProjectCollapse = (id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, collapsed: !project.collapsed } : project
      )
    }));
  };

  // Command bar state
  const setCommandBarOpen = (open: boolean) => {
    setState(prev => ({ ...prev, commandBarOpen: open }));
  };

  const setCommandBarQuery = (query: string) => {
    setState(prev => ({ ...prev, commandBarQuery: query }));
  };

  // Create a new saved search
  const createSavedSearch = (name: string, query: any, color: string = 'gray') => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    setState(prev => ({
      ...prev,
      savedSearches: [
        ...prev.savedSearches,
        { id, name, color, query } as SavedSearch
      ]
    }));
  };

  // Add a new function to update query block order
  const updateQueryBlockOrder = (blockId: string, order: string[]) => {
    setState(prev => ({
      ...prev,
      queryBlockOrders: {
        ...prev.queryBlockOrders,
        [blockId]: order
      }
    }));
  };

  // Toggle section collapse
  const toggleSectionCollapse = (id: string) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === id ? { ...section, collapsed: !section.collapsed } : section
      )
    }));
  };

  // Create a new section
  const createSection = (name: string, color: string = 'gray') => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const newSection: Section = {
      id,
      name,
      color: color as any, // Type cast to ProjectColor
      collapsed: false
    };
    
    setState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  // Move a project to a section
  const moveProjectToSection = (projectId: string, sectionId: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === projectId ? { ...project, sectionId } : project
      )
    }));
  };

  // Set dragged section
  const setDraggedSection = (id: string | null) => {
    setState(prev => ({ ...prev, draggedSection: id }));
  };

  // Set drag over section
  const setDragOverSection = (id: string | null) => {
    setState(prev => ({ ...prev, dragOverSection: id }));
  };

  // Handle section drop
  const handleSectionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Check if we have a draggedSection (if not, this may be a project drop handled elsewhere)
    if (state.draggedSection === null || state.dragOverSection === null) {
      return;
    }
    
    const draggedIndex = state.sections.findIndex(section => section.id === state.draggedSection);
    const dropIndex = state.sections.findIndex(section => section.id === state.dragOverSection);
    
    if (draggedIndex !== -1 && dropIndex !== -1) {
      const newSections = [...state.sections];
      const [removed] = newSections.splice(draggedIndex, 1);
      newSections.splice(dropIndex, 0, removed);
      
      setState(prev => ({
        ...prev,
        sections: newSections
      }));
    }
    
    setDraggedSection(null);
    setDragOverSection(null);
  };

  // Toggle block selection for multi-select
  const toggleBlockSelection = (id: string, shiftKey = false) => {
    setState(prev => {
      // If shift key is pressed and we have a previous selection, select all blocks in between
      if (shiftKey && prev.selectedBlockIds.length > 0) {
        const lastSelectedId = prev.selectedBlockIds[prev.selectedBlockIds.length - 1];
        const lastSelectedIndex = blocks.findIndex(block => block.id === lastSelectedId);
        const currentIndex = blocks.findIndex(block => block.id === id);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, currentIndex);
          const endIndex = Math.max(lastSelectedIndex, currentIndex);
          
          const blockIdsToSelect = blocks
            .slice(startIndex, endIndex + 1)
            .map(block => block.id);
          
          // Combine with existing selections, removing duplicates
          const combinedSelections = [...new Set([...prev.selectedBlockIds, ...blockIdsToSelect])];
          
          // Update body class
          updateBodyClass(true);
          
          return {
            ...prev,
            selectedBlockIds: combinedSelections,
            isMultiSelectActive: true
          };
        }
      }
      
      // Toggle selection for individual block
      const isSelected = prev.selectedBlockIds.includes(id);
      
      if (isSelected) {
        // If removing the last selected block, disable multi-select mode
        const newSelectedIds = prev.selectedBlockIds.filter(blockId => blockId !== id);
        
        // Update body class
        updateBodyClass(newSelectedIds.length > 0);
        
        return {
          ...prev,
          selectedBlockIds: newSelectedIds,
          isMultiSelectActive: newSelectedIds.length > 0
        };
      } else {
        // Add to selection
        // Update body class
        updateBodyClass(true);
        
        return {
          ...prev,
          selectedBlockIds: [...prev.selectedBlockIds, id],
          isMultiSelectActive: true
        };
      }
    });
  };

  // Utility function to update body class
  const updateBodyClass = (isMultiSelecting: boolean) => {
    if (isMultiSelecting) {
      document.body.classList.add('is-multi-selecting');
    } else {
      document.body.classList.remove('is-multi-selecting');
    }
  };

  // Select all blocks
  const selectAllBlocks = () => {
    updateBodyClass(blocks.length > 0);
    setState(prev => ({
      ...prev,
      selectedBlockIds: blocks.map(block => block.id),
      isMultiSelectActive: blocks.length > 0
    }));
  };

  // Clear block selection
  const clearBlockSelection = () => {
    updateBodyClass(false);
    setState(prev => ({
      ...prev,
      selectedBlockIds: [],
      isMultiSelectActive: false
    }));
  };

  // Handle multiple block drag and drop
  const handleMultiBlockDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (state.dragOverBlock && state.selectedBlockIds.length > 0) {
      // Get the drop target position
      const dropIndex = blocks.findIndex(block => block.id === state.dragOverBlock);
      
      if (dropIndex !== -1) {
        // Create a copy of blocks to modify
        let newBlocks = [...blocks];
        
        // Sort selected blocks by their current index to maintain relative order
        const selectedBlocks = state.selectedBlockIds
          .map(id => {
            const index = newBlocks.findIndex(block => block.id === id);
            return { id, index, block: newBlocks[index] };
          })
          .filter(item => item.index !== -1)
          .sort((a, b) => a.index - b.index);
        
        // Remove selected blocks from the array
        const remainingBlocks = newBlocks.filter(
          block => !state.selectedBlockIds.includes(block.id)
        );
        
        // Calculate insert position
        let insertPosition = dropIndex;
        
        // If dropping after all existing selected blocks, adjust position
        const selectedIndices = selectedBlocks.map(sb => sb.index);
        const nonSelectedBeforeDropIndex = selectedIndices.filter(index => index < dropIndex).length;
        insertPosition -= nonSelectedBeforeDropIndex;
        
        // Insert selected blocks at the new position
        remainingBlocks.splice(
          insertPosition, 
          0, 
          ...selectedBlocks.map(sb => sb.block)
        );
        
        // Update the blocks
        updateBlocks(remainingBlocks);
      }
    }
    
    setDraggedBlock(null);
    setDragOverBlock(null);
  };

  // Delete a project
  const deleteProject = (id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }));
  };

  // Pin a project
  const pinProject = (id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, type: 'pinned' } : project
      )
    }));
  };

  // Unpin a project
  const unpinProject = (id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, type: 'project' } : project
      )
    }));
  };

  // Update a project
  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, ...updates } : project
      )
    }));
  };

  // Context provider value
  const value = {
    state,
    blocks,
    setActiveView,
    updateBlocks,
    toggleBlockCheck,
    handleIndent,
    addBlock,
    setDraggedBlock,
    setDragOverBlock,
    handleBlockDrop,
    setDraggedProject,
    setDragOverProject,
    handleProjectDrop,
    toggleProjectCollapse,
    setCommandBarOpen,
    setCommandBarQuery,
    isInSavedSearch: isSavedSearch,
    createSavedSearch,
    updateQueryBlockOrder,
    createSection,
    toggleSectionCollapse,
    moveProjectToSection,
    setDraggedSection,
    setDragOverSection,
    handleSectionDrop,
    toggleBlockSelection,
    selectAllBlocks,
    clearBlockSelection,
    handleMultiBlockDrop,
    deleteProject,
    pinProject,
    unpinProject,
    updateProject
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
