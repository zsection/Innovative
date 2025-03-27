export type ProjectType = 'pinned' | 'project' | 'subproject';

export type ProjectColor = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'indigo' | 'gray';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  icon?: string; 
  color?: ProjectColor;
  collapsed?: boolean;
  subprojects?: Project[];
  sectionId?: string;
}

export type BlockType = 'text' | 'task' | 'bullet' | 'numbered' | 'heading' | 'query' | 'divider' | 'movie';

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4' | '';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  headingLevel?: 1 | 2 | 3;
  priority?: PriorityLevel;
  date?: string;
  tags: string[];
  collapsed?: boolean;
  children?: string[];
  _sourceProject?: string; // Used to track origin project in saved searches
  query?: QueryCriteria; // For query blocks
  bgColor?: string; // For query block background color
  showTitle?: boolean; // For controlling query block title visibility
  url?: string; // For movie blocks to store URL
}

export interface QueryCriteria {
  blockTypes?: BlockType[];
  priorities?: PriorityLevel[];
  tags?: string[];
  dates?: string[];
  text?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  color: ProjectColor;
  query: SearchQuery;
}

export interface SearchQuery {
  priority?: PriorityLevel;
  tags?: string[];
  date?: string;
  text?: string;
}

export interface Section {
  id: string;
  name: string;
  color: string;
  collapsed?: boolean;
}

export interface AppState {
  activeView: string;
  projects: Project[];
  sections: Section[];
  allBlocks: Record<string, Block[]>;
  savedSearches: SavedSearch[];
  savedSearchOrders: Record<string, string[]>;
  queryBlockOrders: Record<string, string[]>;
  draggedBlock: string | null;
  dragOverBlock: string | null;
  draggedProject: string | null;
  dragOverProject: string | null;
  draggedSection: string | null;
  dragOverSection: string | null;
  indentations: Record<string, number>;
  commandBarOpen: boolean;
  commandBarQuery: string;
  tagCollection: string[];
  selectedBlockIds: string[]; // Track selected block IDs
  isMultiSelectActive: boolean; // Track if multi-select mode is active
}
