import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectColor } from '../../utils/types';
import { getColorForProject } from '../../utils/blockUtils';
import { useAppContext } from '../../store/store';

interface EditProjectProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  sectionId?: string; // Optional section ID for new projects
}

const EditProject: React.FC<EditProjectProps> = ({ project, isOpen, onClose, sectionId }) => {
  const { state, createProject, updateProject } = useAppContext();
  const [projectName, setProjectName] = useState(project?.name || '');
  const [projectColor, setProjectColor] = useState<ProjectColor>(project?.color as ProjectColor || 'blue');
  const inputRef = useRef<HTMLInputElement>(null);
  const isNewProject = !project;

  // Color options matching the screenshot
  const colorOptions: ProjectColor[] = ['red', 'orange', 'green', 'blue', 'purple', 'indigo', 'teal', 'gray'];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    
    // Update state when project changes
    if (project) {
      setProjectName(project.name);
      setProjectColor(project.color as ProjectColor || 'blue');
    } else {
      // Default values for new project
      setProjectName('');
      setProjectColor('blue');
    }
  }, [isOpen, project]);

  const handleSave = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) return;
    
    if (isNewProject && sectionId) {
      // Create new project
      createProject(trimmedName, sectionId, projectColor);
    } else if (project) {
      // Update existing project
      updateProject(project.id, {
        name: trimmedName,
        color: projectColor
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border border-swiss-black rounded-sm w-[450px] shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-3">{isNewProject ? 'New Project' : 'Edit Project'}</h2>
          
          {/* Project Name */}
          <div className="mb-3">
            <label className="block text-base mb-1">Name</label>
            <input
              ref={inputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
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
                  onClick={() => setProjectColor(color)}
                  className={`w-10 h-10 rounded-full flex-shrink-0 ${
                    projectColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
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
              disabled={!projectName.trim()}
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

export default EditProject; 