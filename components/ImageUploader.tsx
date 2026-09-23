
import React, { useState, useCallback, useMemo } from 'react';
import { PlaceholderImageIcon, TrashIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File | null) => void;
  title?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, title = "Upload Image" }) => {
  const [image, setImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const imageUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImage(file);
        onImageUpload(file);
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [onImageUpload]);

  const removeImage = () => {
    setImage(null);
    onImageUpload(null);
  };

  if (imageUrl) {
    return (
      <div className="relative w-full h-full min-h-[12rem] bg-gray-100 rounded-lg flex items-center justify-center">
        <img src={imageUrl} alt="Preview" className="max-w-full max-h-48 object-contain rounded-md" />
        <button
          onClick={removeImage}
          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full h-full min-h-[12rem] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition-colors ${
        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
      />
      <label htmlFor="file-upload" className="cursor-pointer text-gray-500">
        <PlaceholderImageIcon className="mx-auto mb-4" />
        <p className="font-semibold text-gray-700">{title}</p>
        <p>Drag & drop or <span className="text-indigo-600 font-semibold">click to browse</span></p>
      </label>
    </div>
  );
};

export default ImageUploader;
