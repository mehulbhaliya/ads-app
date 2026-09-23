
import React from 'react';
import { TaskType } from '../types';
import { TASK_DETAILS } from '../constants';
import { HomeIcon } from './icons';

interface SidebarProps {
  productImageUrl: string;
  tasks: TaskType[];
  activeTask: TaskType;
  onSelectTask: (task: TaskType) => void;
  onBackToHome: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ productImageUrl, tasks, activeTask, onSelectTask, onBackToHome }) => {
  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">PRODUCT</h2>
        <img src={productImageUrl} alt="Product" className="w-full rounded-lg object-cover aspect-square" />
      </div>
      <nav className="flex-1">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">TASKS</h2>
        <ul>
          {tasks.map(task => {
            const details = TASK_DETAILS[task];
            const isActive = task === activeTask;
            return (
              <li key={task}>
                <button
                  onClick={() => onSelectTask(task)}
                  className={`w-full text-left flex items-center p-3 my-1 rounded-md transition-colors ${
                    isActive ? 'bg-brand-primary text-white' : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <details.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-brand-secondary'}`} />
                  <span>{details.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto">
        <button onClick={onBackToHome} className="w-full flex items-center p-3 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">
            <HomeIcon className="w-5 h-5 mr-3" />
            <span>Back to Home</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
