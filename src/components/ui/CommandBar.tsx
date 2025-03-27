
import React, { useEffect, useRef } from 'react';
import { Film, Lightbulb, Music } from 'lucide-react';
import { useAppContext } from '../../store/store';

const CommandBar: React.FC = () => {
  const { state, setCommandBarOpen, setCommandBarQuery, createSavedSearch } = useAppContext();
  const { commandBarOpen, commandBarQuery } = state;
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus command input when opened
  useEffect(() => {
    if (commandBarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandBarOpen]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open command bar
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandBarOpen(true);
      }
      
      // Escape to close command bar
      if (e.key === 'Escape' && commandBarOpen) {
        setCommandBarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandBarOpen, setCommandBarOpen]);
  
  // Handle command execution
  const executeCommand = (command: string) => {
    switch (command) {
      case 'create-movie-list':
        createSavedSearch('Movies to Watch', { tags: ['movie'] }, 'red');
        break;
      case 'create-music-list':
        createSavedSearch('Music to Listen', { tags: ['music'] }, 'blue');
        break;
      case 'create-ideas-collection':
        createSavedSearch('Ideas', { tags: ['idea'] }, 'purple');
        break;
      default:
        break;
    }
    
    setCommandBarOpen(false);
  };
  
  if (!commandBarOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-sm shadow-2xl w-1/2 max-w-2xl overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-swiss-lightGray">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type a command..."
            value={commandBarQuery}
            onChange={(e) => setCommandBarQuery(e.target.value)}
            className="w-full p-2 border-none focus:outline-none text-lg"
          />
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-swiss-midGray px-2 py-1">SUGGESTED</div>
            <div 
              className="command-item"
              onClick={() => executeCommand('create-movie-list')}
            >
              <Film size={16} className="mr-2 text-swiss-midGray" />
              <span>Create a movie list</span>
            </div>
            <div 
              className="command-item"
              onClick={() => executeCommand('create-music-list')}
            >
              <Music size={16} className="mr-2 text-swiss-midGray" />
              <span>Create a music list</span>
            </div>
            <div 
              className="command-item"
              onClick={() => executeCommand('create-ideas-collection')}
            >
              <Lightbulb size={16} className="mr-2 text-swiss-midGray" />
              <span>Create an ideas collection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBar;
