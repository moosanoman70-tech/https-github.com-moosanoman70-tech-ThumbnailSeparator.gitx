import React, { useEffect, useState } from 'react';
import { LayerData, ElementType } from '../types';
import { cropLayer, downloadFile } from '../utils/imageProcessing';

interface LayerListProps {
  layers: LayerData[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  originalImage: HTMLImageElement | null;
}

export const LayerList: React.FC<LayerListProps> = ({ 
  layers, 
  selectedLayerId, 
  onSelectLayer, 
  onToggleVisibility,
  originalImage
}) => {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Generate thumbnails for layers lazily
  useEffect(() => {
    if (!originalImage || layers.length === 0) return;
    
    const newThumbs: Record<string, string> = {};
    layers.forEach(layer => {
      if (!thumbnails[layer.id]) {
        newThumbs[layer.id] = cropLayer(originalImage, layer.box);
      }
    });

    if (Object.keys(newThumbs).length > 0) {
      setThumbnails(prev => ({ ...prev, ...newThumbs }));
    }
  }, [layers, originalImage]);

  const getIcon = (type: ElementType) => {
    switch(type) {
      case ElementType.PERSON: return '👤';
      case ElementType.TEXT: return 'Tt';
      case ElementType.OBJECT: return '📦';
      case ElementType.BACKGROUND: return '🌄';
      case ElementType.EFFECT: return '✨';
      case ElementType.LOGO: return '💠';
      default: return '🔹';
    }
  };

  const handleDownload = (e: React.MouseEvent, layer: LayerData) => {
    e.stopPropagation();
    const dataUrl = thumbnails[layer.id];
    if (dataUrl) {
      downloadFile(dataUrl, `${layer.label.replace(/\s+/g, '_')}.png`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-full overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gray-850">
        <h2 className="font-bold text-white flex justify-between items-center">
          <span>Layers</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{layers.length}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {[...layers].reverse().map((layer) => ( // Reverse to show top layer first in list
          <div 
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`
              flex items-center p-2 rounded-lg cursor-pointer border transition-colors group
              ${selectedLayerId === layer.id 
                ? 'bg-brand-500/10 border-brand-500/50' 
                : 'bg-gray-800/50 border-transparent hover:bg-gray-800'
              }
            `}
          >
            {/* Visibility Toggle */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              className={`mr-3 text-gray-500 hover:text-white ${!layer.visible && 'opacity-30'}`}
            >
              👁
            </button>

            {/* Thumbnail Preview */}
            <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden mr-3 shrink-0 relative checkerboard">
               {thumbnails[layer.id] ? (
                 <img src={thumbnails[layer.id]} className="w-full h-full object-contain" alt="" />
               ) : (
                 <div className="w-full h-full animate-pulse bg-gray-600" />
               )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs">{getIcon(layer.type)}</span>
                <p className={`text-sm font-medium truncate ${selectedLayerId === layer.id ? 'text-brand-400' : 'text-gray-200'}`}>
                  {layer.label}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate capitalize">
                {layer.subtype || layer.type.toLowerCase()} • Z: {layer.zIndex}
              </p>
            </div>

            {/* Quick Actions */}
            <button 
              onClick={(e) => handleDownload(e, layer)}
              className="ml-2 p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download Crop"
            >
              ⬇
            </button>
          </div>
        ))}
      </div>
      
      {/* Footer / Legend */}
      <div className="p-3 border-t border-gray-800 text-xs text-gray-500 flex justify-between bg-gray-900">
        <span>Foreground</span>
        <span>Background</span>
      </div>
    </div>
  );
};
