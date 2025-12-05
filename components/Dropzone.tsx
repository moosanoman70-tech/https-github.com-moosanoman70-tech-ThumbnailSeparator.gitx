import React, { useRef, useState } from 'react';

interface DropzoneProps {
  onImageSelected: (base64: string, rawFile: File) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Strip mimetype prefix to get raw base64 if needed elsewhere, 
      // but standard Image src uses the full string.
      // For Gemini, we usually strip it in the service if passing pure base64.
      // But let's pass the full DataURL and handle splitting in the parent or service.
      
      // Actually, for Gemini SDK, we usually need the base64 part only (after comma).
      // Let's pass the full thing and helper can strip it.
      onImageSelected(result, file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`
        w-full h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center
        transition-all duration-300 cursor-pointer
        ${isDragging 
          ? 'border-brand-500 bg-brand-500/10 scale-[1.01]' 
          : 'border-gray-700 bg-gray-850 hover:border-gray-500'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={inputRef} 
        onChange={handleChange} 
        accept="image/*"
      />
      
      <div className="text-6xl mb-4 opacity-80">
        📷
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">
        Drop Thumbnail Here
      </h3>
      <p className="text-gray-400 mb-6">or click to browse</p>
      
      <div className="flex gap-4 text-xs text-gray-500 font-mono">
        <span className="bg-gray-800 px-2 py-1 rounded">JPG</span>
        <span className="bg-gray-800 px-2 py-1 rounded">PNG</span>
        <span className="bg-gray-800 px-2 py-1 rounded">WEBP</span>
      </div>
    </div>
  );
};
