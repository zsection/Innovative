import React, { useState, useRef, useEffect } from 'react';
import { ProjectColor } from '../../utils/types';
import { getColorForProject } from '../../utils/blockUtils';
import { useAppContext } from '../../store/store';

interface AddSubprojectProps {
  parentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddSubproject: React.FC<AddSubprojectProps> = ({ parentId, isOpen, onClose }) => {
  const { addSubproject } = useAppContext();
  const [subprojectName, setSubprojectName] = useState('');
  const [subprojectColor, setSubprojectColor] = useState<ProjectColor>('blue');
  const inputRef = useRef<HTMLInputElement>(null);

  // Color options matching the project colors
  const colorOptions: ProjectColor[] = ['red', 'orange', 'green', 'blue', 'purple', 'indigo', 'teal', 'gray'];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Reset form state when opening
      setSubprojectName('');
      setSubprojectColor('blue');
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedName = subprojectName.trim();
    if (!trimmedName) return;
    
    console.log(`Adding subproject "${trimmedName}" with color "${subprojectColor}" to parent "${parentId}"`);
    addSubproject(parentId, trimmedName, subprojectColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border border-swiss-black rounded-sm w-[450px] shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-3">Add Subproject</h2>
          
          {/* Subproject Name */}
          <div className="mb-3">
            <label className="block text-base mb-1">Name</label>
            <input
              ref={inputRef}
              type="text"
              value={subprojectName}
              onChange={(e) => setSubprojectName(e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded-sm text-base focus:outline-none focus:border-swiss-black"
            />
          </div>
          
          {/* Color Selection */}
          <div className="mb-4">
            <label className="block text-base mb-1">Color</label>
            <div className="flex space-x-3 mt-1">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setSubprojectColor(color)}
                  className={`w-10 h-10 rounded-full flex-shrink-0 ${
                    subprojectColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ 
                    backgroundColor: getColorForProject(color),
                    aspectRatio: '1 / 1'
                  }}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!subprojectName.trim()}
              className="px-4 py-1.5 bg-gray-800 text-white rounded-sm hover:bg-black disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSubproject; 