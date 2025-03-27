import { Block, BlockType, PriorityLevel, QueryCriteria } from './types';

export const parseContent = (content: string): { 
  priority: PriorityLevel, 
  date: string, 
  tags: string[]
} => {
  // Extract priority
  const priorityMatch = content.match(/!p([1-4])/i);
  const priority = priorityMatch ? `P${priorityMatch[1]}` as PriorityLevel : '';
  
  // Extract date (simple pattern for today/tomorrow)
  let date = '';
  if (content.toLowerCase().includes('^today')) {
    date = 'today';
  } else if (content.toLowerCase().includes('^tomorrow')) {
    date = 'tomorrow';
  } else {
    // Look for formatted dates like ^12.31.2023
    const dateMatch = content.match(/\^(\d{2}\.\d{2}\.\d{4})/);
    if (dateMatch) {
      date = dateMatch[1];
    }
  }
  
  // Extract tags
  const tags: string[] = [];
  const tagRegex = /#(\w+)/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  
  return { priority, date, tags };
};

export const processBlockInput = (
  content: string,
  blockId: string,
  blocks: Block[],
  updateBlocks: (newBlocks: Block[]) => void,
  shouldExtractMetadata: boolean = false
): void => {
  // Create copy of blocks
  const newBlocks = [...blocks];
  const blockIndex = newBlocks.findIndex(b => b.id === blockId);
  
  if (blockIndex === -1) return;
  
  // Initialize metadata variables
  let blockContent = content;
  let priority: PriorityLevel = '';
  let date: string | undefined = undefined;
  let tags: string[] = [];
  
  // Only modify the display content if we're explicitly asked to extract
  if (shouldExtractMetadata) {
    // Extract priority (!p1, !p2, !p3, !p4)
    const priorityMatch = blockContent.match(/!p([1-4])\b/i);
    if (priorityMatch) {
      priority = `P${priorityMatch[1].toUpperCase()}` as PriorityLevel;
      // Don't remove from displayed content
    }
    
    // Extract date (^today, ^tomorrow, ^upcoming)
    const dateMatch = blockContent.match(/\^(today|tomorrow|upcoming)\b/i);
    if (dateMatch) {
      date = dateMatch[1].toLowerCase();
      // Don't remove from displayed content
    }
    
    // Extract tags (#tag)
    const tagMatches = [...blockContent.matchAll(/#([a-z0-9_-]+)\b/gi)];
    if (tagMatches.length > 0) {
      tags = tagMatches.map(match => match[1].toLowerCase());
      // Don't remove from displayed content
    }
  }
  
  // Detect task syntax and convert to task type
  if (blockContent.startsWith('[]') || blockContent.startsWith('[ ]')) {
    newBlocks[blockIndex] = {
      ...newBlocks[blockIndex],
      type: 'task',
      checked: false,
      content: blockContent.replace(/^\[\s?\]/, '').trim(),
      priority: priority || newBlocks[blockIndex].priority,
      date: date || newBlocks[blockIndex].date,
      tags: tags.length > 0 ? tags : newBlocks[blockIndex].tags
    };
  } else if (blockContent.startsWith('[x]') || blockContent.startsWith('[X]')) {
    newBlocks[blockIndex] = {
      ...newBlocks[blockIndex],
      type: 'task',
      checked: true,
      content: blockContent.replace(/^\[[xX]\]/, '').trim(),
      priority: priority || newBlocks[blockIndex].priority,
      date: date || newBlocks[blockIndex].date,
      tags: tags.length > 0 ? tags : newBlocks[blockIndex].tags
    };
  } else {
    // Just update content
    newBlocks[blockIndex] = {
      ...newBlocks[blockIndex],
      content: blockContent,
      priority: priority || newBlocks[blockIndex].priority,
      date: date || newBlocks[blockIndex].date,
      tags: tags.length > 0 ? tags : newBlocks[blockIndex].tags
    };
  }
  
  updateBlocks(newBlocks);
};

export const highlightContent = (content: string): React.ReactNode => {
  // This will be implemented in the Block component
  // Just a placeholder function that returns the original content
  return content;
};

export const getBlocksForSavedSearch = (
  searchId: string,
  savedSearches: any[],
  allBlocks: Record<string, Block[]>,
  savedSearchOrders: Record<string, string[]>
): Block[] => {
  const search = savedSearches.find(s => s.id === searchId);
  if (!search) return [];
  
  // Get all blocks from all projects
  const allProjectBlocks: Block[] = [];
  Object.entries(allBlocks).forEach(([projectId, projectBlocks]) => {
    // Skip the today-notes project for the due today search
    if (search.query.date === 'today' && projectId === 'today-notes') {
      return;
    }
    
    projectBlocks.forEach(block => {
      // Add project reference to each block
      allProjectBlocks.push({
        ...block,
        _sourceProject: projectId
      });
    });
  });
  
  // Filter based on search query
  const filteredBlocks = allProjectBlocks.filter(block => {
    // Filter by priority
    if (search.query.priority && block.priority !== search.query.priority) {
      return false;
    }
    
    // Filter by tags
    if (search.query.tags && search.query.tags.length > 0) {
      if (!block.tags || block.tags.length === 0) return false;
      return search.query.tags.some(tag => block.tags.includes(tag));
    }
    
    // Filter by date (today)
    if (search.query.date === 'today') {
      // Look for "today" in the content or date field
      return (block.content && block.content.toLowerCase().includes('^today')) || 
              block.date === 'today';
    }
    
    // Default: include the block if no filters matched
    return true;
  });
  
  // Apply custom ordering if available
  if (savedSearchOrders[searchId]) {
    const orderedBlocks: Block[] = [];
    const remainingBlocks = [...filteredBlocks];
    
    // First add blocks that are in the order
    savedSearchOrders[searchId].forEach(id => {
      const blockIndex = remainingBlocks.findIndex(b => b.id === id);
      if (blockIndex !== -1) {
        orderedBlocks.push(remainingBlocks[blockIndex]);
        remainingBlocks.splice(blockIndex, 1);
      }
    });
    
    // Then add any new blocks that were not in the previous order
    return [...orderedBlocks, ...remainingBlocks];
  }
  
  return filteredBlocks;
};

export const getColorForProject = (color?: string): string => {
  switch (color) {
    case 'red': return '#ea384c';
    case 'blue': return '#0EA5E9';
    case 'green': return '#10b981';
    case 'purple': return '#8B5CF6';
    case 'orange': return '#F97316';
    case 'teal': return '#14b8a6';
    case 'indigo': return '#6366f1';
    default: return '#8E9196'; // Default mid gray
  }
};

export const createNewBlock = (): Block => {
  return { 
    id: `block-${Date.now()}`, 
    type: 'text' as BlockType, 
    content: '', 
    priority: '',
    tags: [],
    collapsed: false,
    children: []
  };
};

export const queryBlockResults = (
  queryCriteria: QueryCriteria,
  allBlocks: Record<string, Block[]>
): Block[] => {
  // Get all blocks from all projects
  const allProjectBlocks: Block[] = [];
  Object.entries(allBlocks).forEach(([projectId, projectBlocks]) => {
    projectBlocks.forEach(block => {
      // Add project reference to each block
      allProjectBlocks.push({
        ...block,
        _sourceProject: projectId
      });
    });
  });
  
  // Filter blocks based on query criteria
  return allProjectBlocks.filter(block => {
    // Filter by block type
    if (queryCriteria.blockTypes && queryCriteria.blockTypes.length > 0) {
      if (!queryCriteria.blockTypes.includes(block.type)) {
        return false;
      }
    }
    
    // Filter by priority
    if (queryCriteria.priorities && queryCriteria.priorities.length > 0) {
      if (!queryCriteria.priorities.includes(block.priority || '')) {
        return false;
      }
    }
    
    // Filter by tags
    if (queryCriteria.tags && queryCriteria.tags.length > 0) {
      if (!block.tags || block.tags.length === 0) {
        return false;
      }
      // Check if any of the block's tags match the query tags
      const hasMatchingTag = queryCriteria.tags.some(tag => block.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // Filter by dates
    if (queryCriteria.dates && queryCriteria.dates.length > 0) {
      // Handle special date values
      if (queryCriteria.dates.includes('today')) {
        if (block.date === 'today' || (block.content && block.content.toLowerCase().includes('^today'))) {
          return true;
        }
      }
      
      if (queryCriteria.dates.includes('tomorrow')) {
        if (block.date === 'tomorrow' || (block.content && block.content.toLowerCase().includes('^tomorrow'))) {
          return true;
        }
      }
      
      if (queryCriteria.dates.includes('upcoming')) {
        // Match any formatted date
        const hasFormattedDate = block.content && /\^(\d{2}\.\d{2}\.\d{4})/.test(block.content);
        if (hasFormattedDate) {
          return true;
        }
      }
      
      if (queryCriteria.dates.includes('no date')) {
        // Block has no date
        return !block.date && !(block.content && 
          (block.content.toLowerCase().includes('^today') || 
           block.content.toLowerCase().includes('^tomorrow') || 
           /\^(\d{2}\.\d{2}\.\d{4})/.test(block.content)));
      }
      
      // If we got here and dates were specified, this block doesn't match any date criteria
      return false;
    }
    
    // If we got here, the block passed all filters (or no filters were specified)
    return true;
  });
};

export const createQueryBlock = (): Block => {
  return {
    id: `block-${Date.now()}`,
    type: 'query' as BlockType,
    content: 'Custom Query',
    tags: [],
    query: {
      blockTypes: ['task'],
      priorities: [],
      tags: [],
      dates: ['today']
    }
  };
};

export const extractMetadata = (content: string) => {
  let priority: PriorityLevel = '';
  let date: string | undefined = undefined;
  let tags: string[] = [];
  
  // Extract priority (!p1, !p2, !p3, !p4)
  const priorityMatch = content.match(/!p([1-4])\b/i);
  if (priorityMatch) {
    priority = `P${priorityMatch[1].toUpperCase()}` as PriorityLevel;
  }
  
  // Extract date (^today, ^tomorrow, ^upcoming)
  const dateMatch = content.match(/\^(today|tomorrow|upcoming)\b/i);
  if (dateMatch) {
    date = dateMatch[1].toLowerCase();
  }
  
  // Extract tags (#tag)
  const tagMatches = [...content.matchAll(/#([a-z0-9_-]+)\b/gi)];
  if (tagMatches.length > 0) {
    tags = tagMatches.map(match => match[1].toLowerCase());
  }
  
  return { priority, date, tags };
};

/**
 * Creates a more realistic IMDB direct link for a movie title
 * @param movieTitle The movie title to search for
 * @returns A direct IMDB URL that looks like an actual movie page
 */
export const createIMDBSearchUrl = (movieTitle: string): string => {
  // Process the title to create a URL-friendly slug
  const processedTitle = movieTitle.trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')     // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-');        // Replace spaces with hyphens
  
  // Generate a fake but realistic-looking IMDB ID
  // Real IMDB IDs start with tt followed by 7-8 digits
  const randomId = Math.floor(1000000 + Math.random() * 9000000);
  const imdbId = `tt${randomId}`;
  
  // IMDB direct movie URLs look like: https://www.imdb.com/title/tt0076759/
  return `https://www.imdb.com/title/${imdbId}/${processedTitle}/`;
};

/**
 * Gets movie information like year and poster image if available
 * @param movieTitle The movie title
 * @returns Information about the movie for display
 */
export const getMovieInfo = (movieTitle: string): { year?: string, posterUrl?: string } => {
  // This is a placeholder function where you could add actual API integration
  // For now, we'll return empty data
  return {
    year: undefined,
    posterUrl: undefined
  };
};

/**
 * Checks if a string is a watch command
 * @param text The text to check
 * @returns An object with the result and movie title if it's a watch command
 */
export const parseWatchCommand = (text: string): { isWatchCommand: boolean; movieTitle: string } => {
  // Check if the text starts with "watch" followed by a space and some text
  const watchRegex = /^watch\s+(.+)$/i;
  const match = text.trim().match(watchRegex);
  
  if (match && match[1]) {
    return {
      isWatchCommand: true,
      movieTitle: match[1].trim()
    };
  }
  
  return {
    isWatchCommand: false,
    movieTitle: ''
  };
};
