
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { DownloadIcon, TrashIcon, ChevronDownIcon, ZoomIcon, WandIcon } from './icons';

interface ResultsPanelProps {
  title: string;
  images: GeneratedImage[];
  onRemoveImage: (id: string) => void;
  onZoomImage: (base64: string) => void;
  onModifyImage: (image: GeneratedImage) => void;
  isCollapsed?: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ title, images, onRemoveImage, onZoomImage, onModifyImage, isCollapsed = false }) => {
    const [collapsed, setCollapsed] = useState(isCollapsed);

    const handleDownload = (base64: string, id: string) => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${base64}`;
        link.download = `visual-ai-studio-${id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <button
                className="w-full flex justify-between items-center text-left text-xl font-bold text-white mb-4"
                onClick={() => setCollapsed(!collapsed)}
            >
                {title}
                <ChevronDownIcon className={`w-6 h-6 transition-transform ${collapsed ? 'transform -rotate-90' : ''}`} />
            </button>
            {!collapsed && (
                images.length === 0 ? (
                    <div className="flex items-center justify-center h-48 bg-gray-800 rounded-lg">
                        <p className="text-gray-500">No images generated yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                        <img src={`data:image/jpeg;base64,${image.base64}`} alt="Generated result" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                            <button onClick={() => onZoomImage(image.base64)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Zoom image">
                                <ZoomIcon className="w-5 h-5 text-white" />
                            </button>
                             <button onClick={() => onModifyImage(image)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Modify image">
                                <WandIcon className="w-5 h-5 text-white" />
                            </button>
                            <button onClick={() => handleDownload(image.base64, image.id)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Download image">
                                <DownloadIcon className="w-5 h-5 text-white" />
                            </button>
                            <button onClick={() => onRemoveImage(image.id)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" aria-label="Delete image">
                                <TrashIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                )
            )}
        </div>
    );
};

export default ResultsPanel;