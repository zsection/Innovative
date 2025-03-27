import React from 'react';
import { useAppContext } from '../../store/store';
import { getColorForProject } from '../../utils/blockUtils';
import { ArrowDown, Settings } from 'lucide-react';

const Header: React.FC = () => {
  const { state } = useAppContext();
  const { activeView, projects, savedSearches } = state;
  
  // Get current view title
  const getViewTitle = (): string => {
    if (activeView === 'inbox') return 'Inbox';
    if (activeView === 'today') return 'Today';
    
    const project = projects.find(p => p.id === activeView);
    if (project) return project.name;
    
    const subproject = projects
      .filter(p => p.subprojects)
      .flatMap(p => p.subprojects || [])
      .find(sp => sp?.id === activeView);
    if (subproject) return subproject.name;
    
    const savedSearch = savedSearches.find(s => s.id === activeView);
    if (savedSearch) return savedSearch.name;
    
    return 'View';
  };
  
  // Get current view color
  const getViewColor = (): string => {
    if (activeView === 'inbox') return getColorForProject('blue');
    if (activeView === 'today') return getColorForProject('orange');
    
    const project = projects.find(p => p.id === activeView);
    if (project) return getColorForProject(project.color);
    
    const subproject = projects
      .filter(p => p.subprojects)
      .flatMap(p => p.subprojects || [])
      .find(sp => sp?.id === activeView);
    if (subproject) return getColorForProject(subproject.color);
    
    const savedSearch = savedSearches.find(s => s.id === activeView);
    if (savedSearch) return getColorForProject(savedSearch.color);
    
    return getColorForProject('gray');
  };
  
  return (
    <div className="py-6 px-8 flex items-center justify-between bg-[#fafafa] border-b border-gray-200">
      <div className="flex items-center">
        <ArrowDown size={36} className="text-blue-500 mr-5" />
        <h1 
          className="text-[48px] font-[700] leading-[58px] text-[rgb(26,26,26)]"
        >
          {getViewTitle()}
        </h1>
      </div>
      
      <div className="settings-button mr-2">
        <button className="text-red-500 flex items-center justify-center p-2 rounded-full hover:bg-gray-100">
          <Settings size={30} />
        </button>
      </div>
    </div>
  );
};

export default Header;
