import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from '../store/store';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BlockEditor from '../components/editor/BlockEditor';
import CommandBar from '../components/ui/CommandBar';
import TodayView from '../components/views/TodayView';
import SavedSearch from '../components/views/SavedSearch';

// Main app wrapper that provides app state
const Index = () => {
  return (
    <AppProvider>
      <MinimalistNotesApp />
    </AppProvider>
  );
};

// Main app component that uses app state
const MinimalistNotesApp = () => {
  const { state, isInSavedSearch } = useAppContext();
  const { activeView } = state;
  
  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add global keyboard shortcuts here
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Render the appropriate content based on active view
  const renderContent = () => {
    if (activeView === 'today') {
      return <TodayView />;
    }
    
    if (isInSavedSearch()) {
      return <SavedSearch />;
    }
    
    // Default block editor for regular projects
    return <BlockEditor />;
  };
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Content area */}
          <div className="flex-1 overflow-auto bg-white">
            {renderContent()}
          </div>
        </div>
      </div>
      
      {/* Command bar */}
      {state.commandBarOpen && <CommandBar />}
    </div>
  );
};

export default Index;
