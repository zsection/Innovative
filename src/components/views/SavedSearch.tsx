
import React from 'react';
import { useAppContext } from '../../store/store';
import Block from '../editor/Block';

const SavedSearch: React.FC = () => {
  const { state, blocks } = useAppContext();
  const { activeView, savedSearches } = state;
  
  // Get the current saved search
  const savedSearch = savedSearches.find(s => s.id === activeView);
  
  // Generate title based on search criteria
  const getSearchTitle = () => {
    if (!savedSearch) return 'Saved Search';
    
    let criteria = [];
    
    if (savedSearch.query.priority) {
      criteria.push(`Priority: ${savedSearch.query.priority}`);
    }
    
    if (savedSearch.query.tags && savedSearch.query.tags.length > 0) {
      criteria.push(`Tags: ${savedSearch.query.tags.join(', ')}`);
    }
    
    if (savedSearch.query.date) {
      criteria.push(`Date: ${savedSearch.query.date}`);
    }
    
    if (criteria.length === 0) return savedSearch.name;
    
    return `${savedSearch.name} — ${criteria.join(' • ')}`;
  };
  
  return (
    <div className="saved-search-view flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <div className="mb-3">
          <h2 className="text-lg font-medium">
            <span className="tag-badge bg-swiss-purple/10 text-swiss-purple mr-2">Search</span>
            {savedSearch?.name}
          </h2>
          <p className="text-sm text-swiss-midGray mt-1">{getSearchTitle()}</p>
        </div>
        
        {/* Search instructions */}
        <div className="bg-swiss-lightGray/50 p-3 rounded-sm border border-swiss-midGray/10 text-sm mb-4">
          <p>This is a saved search view. Items are displayed from their source projects.</p>
          <p className="mt-1">Drag and drop items to reorder them in this view without affecting the original projects.</p>
        </div>
      </div>
      
      {/* Search Results */}
      <div className="flex-1 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="editor-container mb-4">
            {blocks.length > 0 ? (
              blocks.map((block, index) => (
                <Block 
                  key={block.id} 
                  block={block} 
                  index={index} 
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-swiss-midGray">No items found matching this search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedSearch;
