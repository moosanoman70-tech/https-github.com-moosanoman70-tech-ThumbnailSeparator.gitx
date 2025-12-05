import React, { useEffect, useRef, useState } from 'react';
import { LayerData, BoundingBox } from '../types';
import { cropLayer, downloadFile } from '../utils/imageProcessing';

interface LayerCanvasProps {
  imageSrc: string;
  layers: LayerData[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
}

export const LayerCanvas: React.FC<LayerCanvasProps> = ({ 
  imageSrc, 
  layers, 
  selectedLayerId, 
  onSelectLayer 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Handle loading the source image dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgDimensions({ width: naturalWidth, height: naturalHeight });
  };

  // Draw isolated layer crop when selection changes
  useEffect(() => {
    if (selectedLayer && imageRef.current && canvasRef.current && imgDimensions.width > 0) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const box = selectedLayer.box;
      const width = imgDimensions.width;
      const height = imgDimensions.height;

      const sx = box.xmin * width;
      const sy = box.ymin * height;
      const sw = (box.xmax - box.xmin) * width;
      const sh = (box.ymax - box.ymin) * height;

      // Set canvas to the aspect ratio of the crop, but fit within view
      canvasRef.current.width = sw;
      canvasRef.current.height = sh;

      // Clear
      ctx.clearRect(0, 0, sw, sh);

      // Draw crop
      ctx.drawImage(
        imageRef.current,
        sx, sy, sw, sh,
        0, 0, sw, sh
      );
    }
  }, [selectedLayer, imgDimensions, imageSrc]);

  // Style for overlay boxes in full view
  const getStyle = (box: BoundingBox, isSelected: boolean, isVisible: boolean) => {
    if (!isVisible) return { display: 'none' };
    
    return {
      top: `${box.ymin * 100}%`,
      left: `${box.xmin * 100}%`,
      width: `${(box.xmax - box.xmin) * 100}%`,
      height: `${(box.ymax - box.ymin) * 100}%`,
      borderColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
      boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2)' : 'none',
      zIndex: isSelected ? 100 : 10
    };
  };

  const handleDownloadCrop = () => {
    if (selectedLayer && imageRef.current) {
        const dataUrl = cropLayer(imageRef.current, selectedLayer.box);
        downloadFile(dataUrl, `${selectedLayer.label.replace(/\s+/g, '_')}_crop.png`);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-950/50 rounded-lg overflow-hidden border border-gray-800">
      
      {/* Hidden Source Image for Data */}
      <img 
        ref={imageRef}
        src={imageSrc} 
        alt="Source" 
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        onLoad={handleImageLoad}
      />

      {selectedLayer ? (
        // ISOLATED VIEW - Shows only the selected layer crop
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#1a202c]">
          <div className="relative flex-1 flex items-center justify-center w-full min-h-0">
             {/* Checkerboard background container for transparency effect */}
             <div className="relative shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-gray-600 bg-gray-800 checkerboard">
                <canvas 
                    ref={canvasRef}
                    className="max-w-full max-h-[60vh] object-contain block"
                />
             </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
             <div className="text-center">
                <h3 className="text-xl font-bold text-white">{selectedLayer.label}</h3>
                <div className="flex gap-2 justify-center mt-1">
                   <span className="text-xs bg-brand-900/50 text-brand-300 px-2 py-1 rounded border border-brand-800 uppercase tracking-wider">{selectedLayer.type}</span>
                   {selectedLayer.subtype && (
                     <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded uppercase tracking-wider">{selectedLayer.subtype}</span>
                   )}
                </div>
             </div>

             <div className="flex gap-3">
                <button 
                  onClick={() => onSelectLayer(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>←</span> Back to Composition
                </button>
                <button 
                  onClick={handleDownloadCrop}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                  <span>⬇</span> Download PNG
                </button>
             </div>
          </div>
        </div>
      ) : (
        // FULL COMPOSITION VIEW
        <div 
            ref={containerRef} 
            className="relative shadow-2xl transition-opacity duration-500"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
            <img 
            src={imageSrc} 
            alt="Original" 
            className="block max-w-full max-h-[80vh] object-contain select-none"
            />

            {/* Overlay Layers */}
            {layers.map((layer) => (
            <div
                key={layer.id}
                onClick={(e) => {
                e.stopPropagation();
                onSelectLayer(layer.id);
                }}
                className={`
                absolute border-2 cursor-pointer transition-all duration-200 group
                hover:border-brand-500 hover:bg-brand-500/10
                `}
                style={getStyle(layer.box, false, layer.visible)}
            >
                {/* Hover Tag */}
                <div className="absolute -top-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap z-50 pointer-events-none">
                    {layer.label}
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};