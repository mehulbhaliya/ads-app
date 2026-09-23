
import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { TaskType } from '../types';
import { TASK_DETAILS } from '../constants';
import Button from './Button';
import { MagicWandIcon, GoogleGIcon } from './icons';


interface HomeScreenProps {
  onStartGenerating: (image: File, tasks: TaskType[], sceneDescription: string) => void;
}

const StepIndicator = ({ number, text, optionalText }: { number: string; text: string; optionalText?: string }) => (
  <div className="flex items-center gap-3">
    <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
      {number}
    </div>
    <h2 className="text-xl font-semibold text-gray-900">
      {text}
      {optionalText && <span className="ml-2 text-base font-normal text-gray-500">{optionalText}</span>}
    </h2>
  </div>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGenerating }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<TaskType>>(new Set());
  const [sceneDescription, setSceneDescription] = useState('');

  const handleTaskToggle = (task: TaskType) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(task)) {
        newSet.delete(task);
      } else {
        newSet.add(task);
      }
      return newSet;
    });
  };

  const handleStart = () => {
    if (imageFile && selectedTasks.size > 0) {
      onStartGenerating(imageFile, Array.from(selectedTasks), sceneDescription);
    }
  };

  const isStartDisabled = !imageFile || selectedTasks.size === 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#5B21B6] via-[#4F46E5] to-[#7C3AED] p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-10 space-y-10 text-gray-800">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">AI 3D designer</h1>
          <p className="text-lg text-gray-600 mt-2">Transform your product photos into professional marketing assets with AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <StepIndicator number="1" text="Upload Product Image" />
            <div className="mt-4 h-full">
                <ImageUploader onImageUpload={setImageFile} />
            </div>
          </div>
          <div className="space-y-4">
             <StepIndicator number="2" text="Describe The Scene" optionalText="(optional)" />
             <div className="mt-4 relative">
                <textarea
                placeholder="e.g., 'a cozy cabin living room at dusk with warm lighting and rustic furniture'"
                className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-48 resize-none"
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"><MagicWandIcon className="w-5 h-5"/></button>
                    <button className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"><GoogleGIcon className="w-5 h-5"/></button>
                </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <StepIndicator number="3" text="Select Tasks" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {Object.values(TaskType).map((task) => {
              const details = TASK_DETAILS[task];
              const isSelected = selectedTasks.has(task);
              return (
                <button
                  key={task}
                  onClick={() => handleTaskToggle(task)}
                  className={`p-4 border rounded-xl text-left transition-all duration-200 shadow-sm h-full flex flex-col ${
                    isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg'
                  }`}
                >
                  <div className={`w-10 h-10 mb-3 flex items-center justify-center rounded-lg ${details.iconBgColor}`}>
                    <details.icon className="w-6 h-6 text-indigo-700" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{details.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex-1">{details.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleStart} 
            disabled={isStartDisabled} 
            size="lg" 
            className="!text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:transform-none"
          >
            Start Generating
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;