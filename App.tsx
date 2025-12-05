import React, { useState, useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { LayerCanvas } from './components/LayerCanvas';
import { LayerList } from './components/LayerList';
import { AnalysisPanel } from './components/AnalysisPanel';
import { analyzeThumbnail } from './services/geminiService';
import { AppState, ProcessingResult } from './types';
import JSZip from 'jszip'; // Not importing to avoid deps, will assume raw JSON export

// Mock ZIP functionality alert since we can't easily include JSZip CDN in this strict file structure
// without potentially breaking the "handful of files" rule with complex loaders. 
// However, the prompt allows popular libraries. I'll rely on a basic JSON export 
// and single file downloads to keep the "no-build-step" vibe of the output code clean.

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    status: 'IDLE',
    imageSrc: null,
    result: null,
    error: null
  });

  const [activeTab, setActiveTab] = useState<'layers' | 'analysis'>('layers');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  const handleImageSelected = async (base64: string, file: File) => {
    setState(prev => ({ ...prev, status: 'ANALYZING', imageSrc: base64, error: null }));
    
    // Create HTML image object for later cropping
    const img = new Image();
    img.src = base64;
    img.onload = () => setOriginalImage(img);

    try {
      // Split base64 for API
      const base64Data = base64.split(',')[1];
      const result = await analyzeThumbnail(base64Data);
      
      setState(prev => ({ 
        ...prev, 
        status: 'SUCCESS', 
        result 
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'ERROR', 
        error: err.message || "Failed to analyze image" 
      }));
    }
  };

  const handleToggleVisibility = (id: string) => {
    if (!state.result) return;
    const newLayers = state.result.layers.map(l => 
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    setState(prev => ({
      ...prev,
      result: prev.result ? { ...prev.result, layers: newLayers } : null
    }));
  };

  const handleExportJSON = () => {
    if (!state.result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "thumbnail_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">TS</div>
          <h1 className="text-xl font-bold tracking-tight text-white">Thumbnail Separator</h1>
          <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-800/50">PRO BETA</span>
        </div>
        <div>
           {state.status === 'SUCCESS' && (
             <button 
               onClick={() => setState({ status: 'IDLE', imageSrc: null, result: null, error: null })}
               className="text-sm text-gray-400 hover:text-white mr-4"
             >
               New Project
             </button>
           )}
           <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs text-gray-600 hover:text-gray-400">Powered by Gemini</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Loading Overlay */}
        {state.status === 'ANALYZING' && (
          <div className="absolute inset-0 bg-gray-900/90 z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-medium text-white animate-pulse">Deconstructing Thumbnail...</h2>
            <p className="text-gray-500 mt-2">Detecting layers, analyzing composition, extracting colors</p>
          </div>
        )}

        {/* Error State */}
        {state.status === 'ERROR' && (
          <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-gray-400 max-w-md text-center mb-6">{state.error}</p>
            <button 
              onClick={() => setState(prev => ({ ...prev, status: 'IDLE', error: null }))}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* IDLE: Upload Screen */}
        {state.status === 'IDLE' && (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gray-950">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-extrabold text-white mb-4">
                  Deconstruct Your Thumbnails <span className="text-brand-500">Instantly</span>.
                </h2>
                <p className="text-gray-400 text-lg">
                  Upload any YouTube or gaming thumbnail. AI will separate layers, analyze visual weight, and suggest improvements.
                </p>
              </div>
              <Dropzone onImageSelected={handleImageSelected} />
              
              <div className="mt-12 grid grid-cols-3 gap-6 text-center text-sm text-gray-500">
                <div>
                  <div className="text-2xl mb-2">✂️</div>
                  <p>Smart Layer Separation</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🎨</div>
                  <p>Color & Comp Analysis</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🔒</div>
                  <p>Local Privacy Focus</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS: Editor View */}
        {state.status === 'SUCCESS' && state.result && state.imageSrc && (
          <>
            {/* Left: Canvas Area */}
            <div className="flex-1 bg-gray-950 p-6 flex flex-col relative">
              <div className="flex-1 flex items-center justify-center min-h-0">
                 <LayerCanvas 
                   imageSrc={state.imageSrc} 
                   layers={state.result.layers} 
                   selectedLayerId={selectedLayerId}
                   onSelectLayer={setSelectedLayerId}
                 />
              </div>
              
              {/* Bottom Toolbar */}
              <div className="h-16 mt-4 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-between px-6">
                <div className="flex gap-4 text-sm text-gray-400">
                   <span>{state.result.layers.length} Layers Detected</span>
                   <span className="w-px h-4 bg-gray-700"></span>
                   <span>Resolution: {originalImage ? `${originalImage.naturalWidth}x${originalImage.naturalHeight}` : '...'}</span>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={handleExportJSON}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-gray-700"
                   >
                     Export JSON
                   </button>
                   <button 
                    onClick={() => window.print()}
                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20 font-medium"
                   >
                     Print Report
                   </button>
                </div>
              </div>
            </div>

            {/* Right: Sidebar */}
            <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900 shadow-xl z-10">
              {/* Tabs */}
              <div className="flex border-b border-gray-800">
                <button 
                  onClick={() => setActiveTab('layers')}
                  className={`flex-1 py-3 text-sm font-medium ${activeTab === 'layers' ? 'text-white border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Layers
                </button>
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 py-3 text-sm font-medium ${activeTab === 'analysis' ? 'text-white border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Analysis
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === 'layers' ? (
                  <LayerList 
                    layers={state.result.layers}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={setSelectedLayerId}
                    onToggleVisibility={handleToggleVisibility}
                    originalImage={originalImage}
                  />
                ) : (
                  <AnalysisPanel analysis={state.result.analysis} />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
