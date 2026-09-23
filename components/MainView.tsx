
import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import GenerationModule from './GenerationModule';
import ResultsPanel from './ResultsPanel';
import { TaskType, GeneratedImage } from '../types';

interface MainViewProps {
  productImage: File;
  selectedTasks: TaskType[];
  sceneDescription: string;
  onBackToHome: () => void;
}

const MainView: React.FC<MainViewProps> = ({ productImage, selectedTasks, sceneDescription, onBackToHome }) => {
  const [activeTask, setActiveTask] = useState<TaskType>(selectedTasks[0]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageToModify, setImageToModify] = useState<GeneratedImage | null>(null);

  const productImageUrl = useMemo(() => URL.createObjectURL(productImage), [productImage]);

  const addGeneratedImage = (image: GeneratedImage) => {
    setGeneratedImages(prev => [image, ...prev]);
  };
  
  const removeGeneratedImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleStartModification = (image: GeneratedImage) => {
    if (image.sourceTask !== activeTask) {
      setActiveTask(image.sourceTask);
    }
    setImageToModify(image);
  };
  
  const handleModificationApplied = () => {
    setImageToModify(null);
  };

  const imagesForActiveTask = generatedImages.filter(img => img.sourceTask === activeTask);
  const otherImages = generatedImages.filter(img => img.sourceTask !== activeTask);


  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        productImageUrl={productImageUrl}
        tasks={selectedTasks}
        activeTask={activeTask}
        onSelectTask={(task) => {
            setActiveTask(task);
            setImageToModify(null); // Clear modification state when switching tasks
        }}
        onBackToHome={onBackToHome}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">{activeTask}</h1>
            <GenerationModule
              key={activeTask} // Re-mount component when task changes
              taskType={activeTask}
              productImage={productImage}
              sceneDescription={sceneDescription}
              onImageGenerated={addGeneratedImage}
              imageToModify={imageToModify}
              onModificationApplied={handleModificationApplied}
            />
          </div>
          <aside className="w-1/3 bg-gray-900/50 border-l border-gray-700 p-6 flex flex-col overflow-y-auto">
             <ResultsPanel title="Latest Results" images={imagesForActiveTask} onRemoveImage={removeGeneratedImage} onZoomImage={setZoomedImage} onModifyImage={handleStartModification} />
             {otherImages.length > 0 && (
                <div className="mt-8">
                    <ResultsPanel title="Other Generations" images={otherImages} onRemoveImage={removeGeneratedImage} onZoomImage={setZoomedImage} onModifyImage={handleStartModification} isCollapsed={true}/>
                </div>
             )}
          </aside>
        </div>
      </main>
      
      {zoomedImage && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setZoomedImage(null)}
        >
            <img 
                src={`data:image/jpeg;base64,${zoomedImage}`} 
                alt="Zoomed result" 
                className="max-w-full max-h-full object-contain rounded-lg cursor-default"
                onClick={e => e.stopPropagation()}
            />
        </div>
      )}
    </div>
  );
};

export default MainView;