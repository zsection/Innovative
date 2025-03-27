import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Search,
  Minus
} from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BlockCommandMenuProps {
  isOpen: boolean;
  anchorEl: HTMLElement | null;
  onSelect: (type: string) => void;
  onClose: () => void;
}

type CommandOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const BlockCommandMenu: React.FC<BlockCommandMenuProps> = ({ 
  isOpen, 
  anchorEl, 
  onSelect,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const options: CommandOption[] = [
    { 
      id: 'task', 
      label: 'To-do List', 
      icon: <CheckSquare size={16} />, 
      description: 'Add a task with a checkbox' 
    },
    { 
      id: 'bullet', 
      label: 'Bulleted List', 
      icon: <List size={16} />, 
      description: 'Create a bulleted list' 
    },
    { 
      id: 'numbered', 
      label: 'Numbered List', 
      icon: <ListOrdered size={16} />, 
      description: 'Create a numbered list' 
    },
    { 
      id: 'h1', 
      label: 'Heading 1', 
      icon: <Heading1 size={16} />, 
      description: 'Large section heading' 
    },
    { 
      id: 'h2', 
      label: 'Heading 2', 
      icon: <Heading2 size={16} />, 
      description: 'Medium section heading' 
    },
    { 
      id: 'h3', 
      label: 'Heading 3', 
      icon: <Heading3 size={16} />, 
      description: 'Small section heading' 
    },
    { 
      id: 'divider', 
      label: 'Divider', 
      icon: <Minus size={16} />, 
      description: 'Add a horizontal divider line' 
    },
    { 
      id: 'query', 
      label: 'Query Block', 
      icon: <Search size={16} />, 
      description: 'Create a custom query of blocks' 
    },
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!anchorEl) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <div style={{ 
          position: 'absolute',
          top: anchorEl.style.top,
          left: anchorEl.style.left,
          height: anchorEl.style.height,
          pointerEvents: 'none'
        }}></div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0" 
        align="start" 
        side="bottom"
        sideOffset={-8}
        alignOffset={0}
        onEscapeKeyDown={onClose}
        onInteractOutside={onClose}
        forceMount
      >
        <Command className="rounded-lg border border-none shadow-md">
          <CommandInput 
            placeholder="Search blocks..." 
            value={search}
            onValueChange={setSearch}
            ref={inputRef}
            className="h-11"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Add blocks">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-swiss-lightGray text-swiss-black">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-swiss-midGray">{option.description}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BlockCommandMenu;
