import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/store';
import { getColorForProject } from '../../utils/blockUtils';
import { ArrowRight, Calendar, ChevronDown, ChevronRight, Command, Hash, Plus, Folder, ChevronsRight, ChevronsLeft } from 'lucide-react';
import EditProject from '../modals/EditProject';
import AddSubproject from '../modals/AddSubproject';
import ContextMenu from '../ui/ContextMenu';
import { Project } from '../../utils/types';

// Create a new recursive SubprojectList component above the main Sidebar component
const SubprojectList: React.FC<{
  subprojects: Project[];
  activeView: string;
  setActiveView: (id: string) => void;
  toggleProjectCollapse: (id: string) => void;
  handleProjectContextMenu: (e: React.MouseEvent, project: Project) => void;
  setCurrentProject: (project: Project) => void;
  setAddSubprojectModalOpen: (open: boolean) => void;
  depth?: number; // Add depth parameter with optional default
}> = ({ 
  subprojects, 
  activeView, 
  setActiveView, 
  toggleProjectCollapse, 
  handleProjectContextMenu,
  setCurrentProject,
  setAddSubprojectModalOpen,
  depth = 1 // Default to depth 1 if not provided
}) => {
  if (!subprojects || subprojects.length === 0) return null;
  
  // Limit to 5 levels deep
  const maxDepth = 5;
  const canNestDeeper = depth < maxDepth;
  
  return (
    <ul className="ml-5 mt-0.5 space-y-0.5">
      {subprojects.map((subproject, index) => (
        <li 
          key={subproject.id}
          className="rounded-sm project-nested"
        >
          <div className={`flex items-center p-1.5 rounded-sm cursor-pointer ${
            activeView === subproject.id ? 'bg-swiss-lightGray' : 'hover:bg-swiss-lightGray/50'
          } group`}
          onClick={() => setActiveView(subproject.id)}
          onContextMenu={(e) => handleProjectContextMenu(e, subproject)}
          >
            <div className="w-4 h-4 min-w-[16px] mr-2 flex items-center justify-center">
              <span 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColorForProject(subproject.color) }}
              ></span>
            </div>
            <span className="text-base font-medium">{subproject.name}</span>
            
            <div className="ml-auto flex items-center">
              {/* Only show add button if within depth limit */}
              {canNestDeeper && (
                <button 
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-swiss-midGray hover:text-swiss-black focus:outline-none transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentProject(subproject);
                    setAddSubprojectModalOpen(true);
                  }}
                  aria-label={`Add subproject to ${subproject.name}`}
                >
                  <Plus size={14} />
                </button>
              )}
            
              {subproject.subprojects && subproject.subprojects.length > 0 && (
                <button 
                  className="opacity-0 group-hover:opacity-100 text-swiss-midGray focus:outline-none transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProjectCollapse(subproject.id);
                  }}
                >
                  {subproject.collapsed ? 
                    <ChevronRight size={14} /> : 
                    <ChevronDown size={14} />
                  }
                </button>
              )}
            </div>
          </div>
          
          {/* Recursively render nested subprojects if within depth limit */}
          {canNestDeeper && subproject.subprojects && subproject.subprojects.length > 0 && !subproject.collapsed && (
            <div className={depth > 1 ? "project-tree-line" : ""}>
              <SubprojectList 
                subprojects={subproject.subprojects}
                activeView={activeView}
                setActiveView={setActiveView}
                toggleProjectCollapse={toggleProjectCollapse}
                handleProjectContextMenu={handleProjectContextMenu}
                setCurrentProject={setCurrentProject}
                setAddSubprojectModalOpen={setAddSubprojectModalOpen}
                depth={depth + 1} // Increment depth for next level
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const Sidebar: React.FC = () => {
  const { 
    state, 
    setActiveView, 
    setDraggedProject, 
    setDragOverProject, 
    handleProjectDrop, 
    toggleProjectCollapse,
    setCommandBarOpen,
    createSection,
    toggleSectionCollapse,
    deleteProject,
    pinProject,
    unpinProject,
    updateProject
  } = useAppContext();
  
  const { activeView, projects, sections, dragOverProject } = state;
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSectionMode, setIsAddingSectionMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Project editing state
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [addSubprojectModalOpen, setAddSubprojectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    projectId: string | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    projectId: null
  });

  // Handle keyboard shortcut display for command bar
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const commandKey = isMac ? '⌘' : 'Ctrl';

  // Debug logging for projects
  useEffect(() => {
    console.log("Current projects structure:", JSON.stringify(projects, null, 2));
  }, [projects]);

  // Handle adding a new section
  const handleAddSection = () => {
    if (newSectionName.trim()) {
      createSection(newSectionName.trim());
      setNewSectionName('');
      setIsAddingSectionMode(false);
    }
  };
  
  // Handle key press for new section input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSection();
    } else if (e.key === 'Escape') {
      setNewSectionName('');
      setIsAddingSectionMode(false);
    }
  };
  
  // Handle creating a new project
  const handleCreateProject = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setCurrentProject(null);
    setEditProjectModalOpen(true);
  };
  
  // Handle right-click on a project
  const handleProjectContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    setCurrentProject(project);
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      projectId: project.id
    });
  };
  
  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Handle edit project
  const handleEditProject = () => {
    if (contextMenu.projectId) {
      const project = projects.find(p => p.id === contextMenu.projectId);
      if (project) {
        setCurrentProject(project);
        setEditProjectModalOpen(true);
      }
    }
  };
  
  // Handle add subproject
  const handleAddSubproject = () => {
    setAddSubprojectModalOpen(true);
  };
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Get context menu items for a project
  const getContextMenuItems = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    const isPinned = project.type === 'pinned';
    // Don't allow editing system pinned items like inbox or today
    const isSystemPinned = isPinned && (project.id === 'inbox' || project.id === 'today');
    
    const menuItems = [
      {
        label: 'Edit Project',
        onClick: handleEditProject,
      }
    ];
    
    // Only add subproject option for non-system projects
    if (!isSystemPinned) {
      menuItems.push({
        label: 'Add Subproject',
        onClick: handleAddSubproject
      });
    }
    
    // Add pin/unpin option for non-system projects
    if (!isSystemPinned) {
      if (isPinned) {
        menuItems.push({
          label: 'Unpin',
          onClick: () => unpinProject(projectId)
        });
      } else {
        menuItems.push({
          label: 'Pin to Top',
          onClick: () => pinProject(projectId)
        });
      }
    }
    
    // Add delete option for non-system projects
    if (!isSystemPinned) {
      menuItems.push({
        label: 'Delete Project',
        onClick: () => deleteProject(projectId)
      });
    }
    
    return menuItems;
  };
  
  return (
    <div 
      className={`bg-[#fffcf7] border-r-2 border-swiss-black overflow-y-auto flex flex-col h-full animate-slide-in transition-all duration-200 group/sidebar ${
        isSidebarCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Project Edit Modal */}
      <EditProject 
        project={currentProject}
        isOpen={editProjectModalOpen}
        onClose={() => setEditProjectModalOpen(false)}
        sectionId={activeSectionId}
      />
      
      {/* Add Subproject Modal */}
      <AddSubproject
        parentId={currentProject?.id || ''}
        isOpen={addSubprojectModalOpen}
        onClose={() => setAddSubprojectModalOpen(false)}
      />
      
      {/* Context Menu */}
      {contextMenu.visible && contextMenu.projectId && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.projectId)}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
      
      {/* Command bar button */}
      <div className="p-2">
        <div 
          className={`flex items-center justify-center ${isSidebarCollapsed ? 'p-2.5 aspect-square' : 'p-2 md:p-3'} bg-[#e23d31] rounded-sm hover:bg-[#d32e22] transition-colors duration-150 cursor-pointer`}
          onClick={() => setCommandBarOpen(true)}
        >
          <Command size={isSidebarCollapsed ? 14 : 16} className="text-white" />
          {!isSidebarCollapsed && (
            <>
              <span className="ml-2 text-sm md:text-base font-medium text-white">Command</span>
              <span className="ml-auto text-xs md:text-sm text-white/70">{commandKey}K</span>
            </>
          )}
        </div>
      </div>
      
      {/* Pinned section - always visible */}
      <div className={`p-1.5 ${isSidebarCollapsed ? 'mt-2 mb-2' : 'mt-2 mb-2'}`}>
        {!isSidebarCollapsed && (
          <div className="mb-1 text-xs font-normal text-swiss-midGray/70 px-2">Pinned</div>
        )}
        <ul className={`${isSidebarCollapsed ? 'flex flex-col items-center space-y-1' : 'space-y-0.5'}`}>
          {projects.filter(p => p.type === 'pinned').map(project => (
            <li 
              key={project.id}
              className={`sidebar-item ${activeView === project.id ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center p-1.5 w-9 h-9 mx-auto' : 'p-1.5'}`}
              onClick={() => setActiveView(project.id)}
              onContextMenu={(e) => handleProjectContextMenu(e, project)}
            >
              {project.icon === 'inbox' ? (
                <div className="w-4 h-4 min-w-[16px] mr-2 flex items-center justify-center">
                  <ArrowRight size={16} className="text-blue-500" />
                </div>
              ) : (
                <div className="w-4 h-4 min-w-[16px] mr-2 flex items-center justify-center">
                  <Calendar size={16} className="text-orange-500" />
                </div>
              )}
              {!isSidebarCollapsed && <span className="text-base font-medium">{project.name}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Sections - only visible when expanded */}
      {!isSidebarCollapsed && (
        <>
          {/* Sections */}
          {sections.map((section, index) => {
            const sectionProjects = projects.filter(p => p.sectionId === section.id && p.type === 'project');
            return (
              <div key={section.id} className={`p-1.5 ${index > 0 ? 'mt-3' : ''}`}>
                <div className="mb-1 flex items-center group">
                  <div 
                    className="flex-grow flex items-center cursor-pointer"
                    onClick={() => toggleSectionCollapse(section.id)}
                  >
                    <span className="text-xs font-normal text-swiss-midGray/70 px-2">{section.name.charAt(0).toUpperCase() + section.name.slice(1).toLowerCase()}</span>
                  </div>
                  
                  {/* Add project button */}
                  <button 
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-swiss-midGray hover:text-swiss-black focus:outline-none transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateProject(section.id);
                    }}
                    aria-label={`Add project to ${section.name}`}
                  >
                    <Plus size={14} />
                  </button>
                  
                  <button 
                    className="ml-1 opacity-0 group-hover:opacity-100 text-swiss-midGray focus:outline-none transition-opacity"
                    onClick={() => toggleSectionCollapse(section.id)}
                  >
                    {section.collapsed ? 
                      <ChevronRight size={14} /> : 
                      <ChevronDown size={14} />
                    }
                  </button>
                </div>
                
                {!section.collapsed && (
                  <ul className="space-y-0.5">
                    {sectionProjects.map(project => (
                      <li 
                        key={project.id}
                        className={`relative rounded-sm cursor-pointer ${
                          dragOverProject === project.id ? 'bg-swiss-lightGray' : ''
                        }`}
                        draggable
                        onDragStart={(e) => setDraggedProject(project.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (state.draggedProject !== project.id) {
                            setDragOverProject(project.id);
                          }
                        }}
                        onDrop={handleProjectDrop}
                        onContextMenu={(e) => handleProjectContextMenu(e, project)}
                      >
                        <div 
                          className={`flex items-center p-1.5 ${activeView === project.id ? 'bg-swiss-lightGray' : 'hover:bg-swiss-lightGray/50'} group`}
                          onClick={() => setActiveView(project.id)}
                        >
                          <div className="w-4 h-4 min-w-[16px] mr-2 flex items-center justify-center">
                            <span 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getColorForProject(project.color) }}
                            ></span>
                          </div>
                          <span className="text-base font-medium">{project.name}</span>
                          
                          <div className="ml-auto flex items-center">
                            <button 
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-swiss-midGray hover:text-swiss-black focus:outline-none transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentProject(project);
                                setAddSubprojectModalOpen(true);
                              }}
                              aria-label={`Add subproject to ${project.name}`}
                            >
                              <Plus size={14} />
                            </button>
                          
                            {project.subprojects && project.subprojects.length > 0 && (
                              <button 
                                className="opacity-0 group-hover:opacity-100 text-swiss-midGray focus:outline-none transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProjectCollapse(project.id);
                                }}
                              >
                                {project.collapsed ? 
                                  <ChevronRight size={14} /> : 
                                  <ChevronDown size={14} />
                                }
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Subprojects - replaced with recursive component */}
                        {project.subprojects && project.subprojects.length > 0 && !project.collapsed && (
                          <div className="project-tree-line">
                            <SubprojectList 
                              subprojects={project.subprojects}
                              activeView={activeView}
                              setActiveView={setActiveView}
                              toggleProjectCollapse={toggleProjectCollapse}
                              handleProjectContextMenu={handleProjectContextMenu}
                              setCurrentProject={setCurrentProject}
                              setAddSubprojectModalOpen={setAddSubprojectModalOpen}
                              depth={1} // Set initial depth to 1
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          
          {/* Add New Section */}
          <div className="p-2 mt-4 relative">
            {isAddingSectionMode ? (
              <div className="py-1">
                <input 
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Section name..."
                  className="w-full p-1.5 text-sm border border-swiss-midGray/30 rounded-sm focus:outline-none focus:ring-1 focus:ring-swiss-black focus:border-swiss-black"
                  autoFocus
                />
                <div className="flex mt-1.5">
                  <button 
                    className="px-2 py-1 text-xs bg-swiss-black text-white rounded-sm mr-1.5"
                    onClick={handleAddSection}
                  >
                    Add
                  </button>
                  <button 
                    className="px-2 py-1 text-xs border border-swiss-midGray/30 rounded-sm"
                    onClick={() => {
                      setNewSectionName('');
                      setIsAddingSectionMode(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="flex items-center w-full p-1.5 text-swiss-midGray hover:bg-swiss-lightGray/50 rounded-sm transition-colors opacity-0 group-hover/sidebar:opacity-100 sm:opacity-0 sm:group-hover/sidebar:opacity-100 max-sm:opacity-100 transition-opacity"
                onClick={() => setIsAddingSectionMode(true)}
              >
                <Plus size={14} className="mr-1.5" />
                <span className="text-xs font-normal">Add section</span>
              </button>
            )}
          </div>
        </>
      )}
      
      {/* User section */}
      <div className={`mt-auto p-2 md:p-3 flex items-center justify-between border-t border-swiss-black/10`}>
        <div className="w-8 h-8 md:w-9 md:h-9 bg-[#e23d31] rounded-full flex items-center justify-center text-white text-sm md:text-base font-medium">
          U
        </div>
        
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <button 
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-swiss-midGray hover:bg-swiss-lightGray/70 rounded-full transition-colors bg-[#f2f2f2]"
            aria-label="Tags"
          >
            <Hash size={16} className="md:h-5 md:w-5" />
          </button>
          
          <button 
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-swiss-midGray hover:bg-swiss-lightGray/70 rounded-full transition-colors bg-[#f2f2f2]"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? 
              <ChevronsRight size={16} className="md:h-5 md:w-5" /> : 
              <ChevronsLeft size={16} className="md:h-5 md:w-5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
