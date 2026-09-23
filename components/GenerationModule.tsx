import React, { useState, useEffect, useRef } from 'react';
import { TaskType, GeneratedImage, ImageData } from '../types';
import { ROOM_TYPES, STYLES, LIGHTING, CATALOG_ANGLES, QUALITY_LEVELS, ASPECT_RATIOS } from '../constants';
import * as geminiService from '../services/geminiService';
import { fileToGenerativePart } from '../utils/fileUtils';
import Button from './Button';
import Spinner from './Spinner';
import ImageUploader from './ImageUploader';
import { UploadIcon, TrashIcon, WandIcon } from './icons';

interface GenerationModuleProps {
  taskType: TaskType;
  productImage: File;
  sceneDescription: string;
  onImageGenerated: (image: GeneratedImage) => void;
  imageToModify: GeneratedImage | null;
  onModificationApplied: () => void;
}

const GenerationModule: React.FC<GenerationModuleProps> = ({ taskType, productImage, sceneDescription, onImageGenerated, imageToModify, onModificationApplied }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [roomPrompt, setRoomPrompt] = useState(sceneDescription);
  const [roomType, setRoomType] = useState('');
  const [style, setStyle] = useState('');
  const [lighting, setLighting] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [inspirationImages, setInspirationImages] = useState<File[]>([]);
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  
  // Catalog Angle states
  const [selectedAngle, setSelectedAngle] = useState(CATALOG_ANGLES[0]);
  const [quality, setQuality] = useState(QUALITY_LEVELS[2]); // Default to 4K
  const [customAnglePrompt, setCustomAnglePrompt] = useState('');

  const [textureFile, setTextureFile] = useState<File | null>(null);

  // Modification states
  const [modificationText, setModificationText] = useState('');
  const [modLighting, setModLighting] = useState('');
  const [modStyle, setModStyle] = useState('');

  useEffect(() => {
    if (imageToModify) {
      // Reset modification form state when a new image is selected for modification
      setModificationText('');
      setModLighting('');
      setModStyle('');
    }
  }, [imageToModify]);
  
  const handleInspirationImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        setInspirationImages(prev => [...prev, ...files].slice(0, 4));
        e.target.value = ''; 
    }
  };

  const removeInspirationImage = (index: number) => {
      setInspirationImages(prev => prev.filter((_, i) => i !== index));
  };


  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const productPart = await fileToGenerativePart(productImage);
      let results: string[] = [];
      switch (taskType) {
        case TaskType.RoomStaging:
          const inspirationImageParts = await Promise.all(inspirationImages.map(file => fileToGenerativePart(file)));
          results = await geminiService.generateRoomStagingVariants({
            product: productPart,
            roomPrompt,
            baseRoomType: roomType,
            baseStyle: style,
            baseLighting: lighting,
            aspectRatio,
            inspirationImages: inspirationImageParts
          });
          break;
        case TaskType.CatalogAngle:
            let angleToGenerate = selectedAngle;
            if (selectedAngle.type === 'custom') {
              if (!customAnglePrompt.trim()) {
                setError("Please describe the custom angle.");
                setIsLoading(false);
                return;
              }
              angleToGenerate = { ...selectedAngle, name: customAnglePrompt };
            }
            results = await geminiService.generateCatalogAngle(productPart, angleToGenerate, quality, aspectRatio);
            break;
        case TaskType.ShadeFinish:
          if (!textureFile) {
            setError("Please upload a texture image to apply a new finish.");
            setIsLoading(false);
            return;
          }
          const shadeTexturePart = await fileToGenerativePart(textureFile);
          results.push(await geminiService.generateShadeFinish(productPart, shadeTexturePart, aspectRatio));
          break;
        case TaskType.Countertop:
          if (!textureFile) {
            setError("Please upload a countertop texture image to apply.");
            setIsLoading(false);
            return;
          }
          const countertopTexturePart = await fileToGenerativePart(textureFile);
          results.push(await geminiService.generateCountertop(productPart, countertopTexturePart, aspectRatio));
          break;
      }
      results.forEach(base64 => onImageGenerated({ id: crypto.randomUUID(), base64, sourceTask: taskType }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleModify = async () => {
    if (!imageToModify) return;

    // Construct modification prompt
    let prompts = [];
    if (modificationText.trim()) prompts.push(modificationText.trim());
    if (modStyle) prompts.push(`change the style to '${modStyle}'`);
    if (modLighting) prompts.push(`change the lighting to '${modLighting}'`);
    
    if (prompts.length === 0) {
        setError("Please describe a modification or select a new style/lighting.");
        return;
    }
    const finalPrompt = prompts.join(", and ");

    setIsLoading(true);
    setError(null);
    try {
        const result = await geminiService.modifyImage(imageToModify.base64, finalPrompt);
        onImageGenerated({ id: crypto.randomUUID(), base64: result, sourceTask: imageToModify.sourceTask });
        onModificationApplied();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const renderAspectRatioSelector = () => (
    <div>
      <label className="text-sm font-medium text-gray-300 mb-2 block">Aspect Ratio</label>
      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIOS.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setAspectRatio(r)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              aspectRatio === r
                ? 'bg-brand-primary text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );

  if (imageToModify) {
    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-white">Modify Image</h2>
            <div className="flex gap-4">
                <img src={`data:image/jpeg;base64,${imageToModify.base64}`} alt="Image to modify" className="w-40 h-40 object-cover rounded-lg"/>
                <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-400">You are modifying an image from: <span className="font-semibold text-gray-300">{imageToModify.sourceTask}</span></p>
                    {imageToModify.sourceTask === TaskType.RoomStaging && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-1 block">New Style</label>
                                <select value={modStyle} onChange={e => setModStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white">
                                    <option value="" disabled>Select Style</option>
                                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-1 block">New Lighting</label>
                                <select value={modLighting} onChange={e => setModLighting(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white">
                                    <option value="" disabled>Select Lighting</option>
                                    {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    <textarea
                        placeholder="Or describe other changes... e.g., 'add a small plant on the left'"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary"
                        rows={2}
                        value={modificationText}
                        onChange={e => setModificationText(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex gap-4">
                <Button onClick={handleModify} disabled={isLoading} className="flex-1">
                    {isLoading ? <Spinner /> : 'Apply Modification'}
                </Button>
                <Button onClick={onModificationApplied} variant="secondary">Cancel</Button>
            </div>
            {error && <p className="text-red-400 mt-4">Error: {error}</p>}
        </div>
    );
  }

  const renderControls = () => {
    switch (taskType) {
      case TaskType.RoomStaging:
        return (
          <div className="space-y-6">
            <textarea
              placeholder="Describe your desired scene..."
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary"
              rows={3}
              value={roomPrompt}
              onChange={(e) => setRoomPrompt(e.target.value)}
            />
             <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Inspiration Images (up to 4, optional)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {inspirationImages.map((file, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={URL.createObjectURL(file)} alt={`Inspiration ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                            <button onClick={() => removeInspirationImage(index)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {inspirationImages.length < 4 && (
                        <button 
                            onClick={() => inspirationInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-brand-secondary hover:text-white transition"
                            aria-label="Add inspiration image"
                        >
                            <UploadIcon className="w-8 h-8" />
                            <span className="text-xs mt-1">Add Image</span>
                        </button>
                    )}
                </div>
                <input 
                    ref={inspirationInputRef}
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleInspirationImageUpload} 
                />
            </div>
            {renderAspectRatioSelector()}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Room Type</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white">
                  <option value="" disabled>Select Room Type</option>
                  {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
               <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Style</label>
                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white">
                  <option value="" disabled>Select Style</option>
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
               <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Lighting</label>
                <select value={lighting} onChange={e => setLighting(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white">
                  <option value="" disabled>Select Lighting</option>
                  {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      case TaskType.CatalogAngle:
        return (
            <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-3">2. Select an Angle</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {CATALOG_ANGLES.map(angle => (
                            <button
                                key={angle.name}
                                onClick={() => setSelectedAngle(angle)}
                                className={`p-3 text-sm text-center rounded-md transition-colors ${
                                    selectedAngle.name === angle.name ? 'bg-brand-primary text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                            >
                                {angle.name}
                            </button>
                        ))}
                    </div>
                </div>
                {selectedAngle.type === 'custom' && (
                  <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Describe Custom Angle</h3>
                      <textarea
                          placeholder="e.g., 'a worm's-eye view looking up, emphasizing the legs' or 'a dramatic shot from above and to the side'"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary"
                          rows={3}
                          value={customAnglePrompt}
                          onChange={(e) => setCustomAnglePrompt(e.target.value)}
                      />
                  </div>
                )}
                {renderAspectRatioSelector()}
            </div>
        );
      case TaskType.ShadeFinish:
      case TaskType.Countertop: {
        const isCountertop = taskType === TaskType.Countertop;
        const title = isCountertop ? 'Countertop' : 'Finish';
        const targetDescription = isCountertop 
            ? "The new countertop will be applied to this product's top surface."
            : "The new finish will be applied to this product.";
        const sourceDescription = isCountertop
            ? "Upload an image of the marble, granite, or other material you want to apply."
            : "Upload an image of the texture, material, or finish you want to apply.";
        const uploaderTitle = `Upload ${title} Texture`;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Column 1: Target Product */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-brand-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <h3 className="text-xl font-semibold text-white">Target Product</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">{targetDescription}</p>
                <div className="w-full bg-gray-900/50 rounded-lg p-4 flex justify-center items-center aspect-square">
                  <img 
                    src={URL.createObjectURL(productImage)} 
                    alt="Target Product" 
                    className="max-w-full max-h-full object-contain rounded-md" 
                  />
                </div>
              </div>
      
              {/* Column 2: Source Material */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-brand-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <h3 className="text-xl font-semibold text-white">Upload Source {title}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">{sourceDescription}</p>
                <div className="w-full aspect-square">
                  <ImageUploader onImageUpload={setTextureFile} title={uploaderTitle} />
                </div>
              </div>
            </div>
            {renderAspectRatioSelector()}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
      <div className="space-y-6">
        {renderControls()}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button onClick={handleGenerate} disabled={isLoading} size="lg" className="flex-1">
            {isLoading ? <Spinner /> : `Generate Image`}
          </Button>
        </div>
        {error && <p className="text-red-400 mt-4">Error: {error}</p>}
      </div>
    </div>
  );
};

export default GenerationModule;