import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, MagicIcon, DownloadIcon, PhotoIcon, RefreshIcon } from './components/Icons';
import { Spinner } from './components/Spinner';
import { editImageWithGemini, extractBase64Data } from './services/geminiService';
import { AppState, SAMPLE_PROMPTS } from './types';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    originalMimeType: '',
    isGenerating: false,
    generatedImage: null,
    error: null,
  });

  const [prompt, setPrompt] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setState(prev => ({ ...prev, error: "Invalid file type. Please upload JPEG, PNG, or WebP." }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setState(prev => ({ ...prev, error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setState({
        originalImage: result,
        originalMimeType: file.type,
        isGenerating: false,
        generatedImage: null,
        error: null,
      });
      // Pre-fill a prompt if empty, or keep user's prompt
      if (!prompt) setPrompt("Add a futuristic neon aesthetic");
    };
    reader.onerror = () => {
      setState(prev => ({ ...prev, error: "Failed to read file." }));
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!state.originalImage || !prompt.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const base64Data = extractBase64Data(state.originalImage);
      const generatedImageBase64 = await editImageWithGemini(
        base64Data,
        state.originalMimeType,
        prompt
      );

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedImage: {
          imageUrl: generatedImageBase64,
          prompt: prompt,
          timestamp: Date.now(),
        },
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || "Something went wrong while generating the image.",
      }));
    }
  };

  const handleReset = () => {
    setState({
      originalImage: null,
      originalMimeType: '',
      isGenerating: false,
      generatedImage: null,
      error: null,
    });
    setPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadImage = () => {
    if (!state.generatedImage) return;
    const link = document.createElement('a');
    link.href = state.generatedImage.imageUrl;
    link.download = `heroforge-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-dark-card bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <MagicIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-200">
              HeroForge AI
            </h1>
          </div>
          <div className="text-sm text-dark-muted hidden sm:block">
            Powered by Gemini 2.5 Flash Image
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Intro Hero Section (Visible only when no image is uploaded) */}
        {!state.originalImage && (
          <div className="text-center max-w-2xl mx-auto mb-16 fade-in">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Reimagine your <span className="text-brand-400">hero images</span> instantly.
            </h2>
            <p className="text-lg text-dark-muted mb-8">
              Upload an image and use natural language to add elements, change styles, or completely redesign the vibe.
              Perfect for creating unique website headers and social media assets.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-[600px]">
          
          {/* Left Column: Upload & Input */}
          <div className="flex flex-col gap-6">
            
            {/* Upload Area */}
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center group h-96
                ${state.originalImage 
                  ? 'border-brand-500/30 bg-dark-card/50' 
                  : 'border-dark-card hover:border-brand-500/50 bg-dark-card hover:bg-dark-card/80 cursor-pointer'
                }`}
              onClick={() => !state.originalImage && fileInputRef.current?.click()}
            >
              {state.originalImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
                  <img 
                    src={state.originalImage} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
                    title="Remove Image"
                  >
                    <RefreshIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                    Original
                  </div>
                </div>
              ) : (
                <>
                  <UploadIcon />
                  <h3 className="text-lg font-semibold text-white mb-2">Upload Source Image</h3>
                  <p className="text-sm text-dark-muted max-w-xs">
                    Click to select a file. JPEG, PNG or WebP up to 5MB.
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp"
                  />
                </>
              )}
            </div>

            {/* Prompt Input Section - Enabled only when image exists */}
            <div className={`transition-opacity duration-500 ${state.originalImage ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="bg-dark-card p-1 rounded-xl shadow-lg border border-dark-card focus-within:border-brand-500/50 transition-colors">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe how you want to change the image..."
                  className="w-full bg-transparent text-white placeholder-dark-muted p-4 outline-none resize-none min-h-[100px] text-lg rounded-t-lg"
                  disabled={state.isGenerating || !state.originalImage}
                />
                <div className="flex justify-between items-center px-2 pb-2">
                   <div className="flex gap-2 overflow-x-auto max-w-[60%] py-2 scrollbar-hide">
                      {/* Empty div to spacing if needed, or dynamic pills */}
                   </div>
                   <button
                    onClick={handleGenerate}
                    disabled={!state.originalImage || !prompt.trim() || state.isGenerating}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all
                      ${(!state.originalImage || !prompt.trim() || state.isGenerating)
                        ? 'bg-dark-muted/20 cursor-not-allowed text-dark-muted' 
                        : 'bg-brand-600 hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/20 active:scale-95'}
                    `}
                   >
                     <MagicIcon />
                     {state.isGenerating ? 'Generating...' : 'Generate Design'}
                   </button>
                </div>
              </div>

              {/* Sample Prompts */}
              {state.originalImage && !state.isGenerating && (
                 <div className="mt-4">
                   <p className="text-xs text-dark-muted uppercase font-bold tracking-wider mb-3">Try these prompts</p>
                   <div className="flex flex-wrap gap-2">
                     {SAMPLE_PROMPTS.map((p) => (
                       <button
                         key={p}
                         onClick={() => setPrompt(p)}
                         className="px-3 py-1.5 bg-dark-card hover:bg-brand-900/30 border border-dark-card hover:border-brand-500/30 rounded-full text-xs text-brand-100 transition-colors text-left"
                       >
                         {p}
                       </button>
                     ))}
                   </div>
                 </div>
              )}
            </div>
            
            {state.error && (
               <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm">
                 {state.error}
               </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="relative border-2 border-dashed border-dark-card rounded-2xl bg-dark-bg min-h-[400px] h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full p-4 border-b border-dark-card bg-dark-card/30 rounded-t-2xl flex justify-between items-center z-10">
               <h3 className="font-semibold flex items-center gap-2 text-dark-muted">
                 <PhotoIcon className="w-5 h-5" />
                 Generated Result
               </h3>
               {state.generatedImage && (
                 <button 
                   onClick={downloadImage}
                   className="flex items-center gap-2 text-sm text-brand-300 hover:text-white transition-colors"
                 >
                   <DownloadIcon /> Download
                 </button>
               )}
            </div>

            <div className="flex-1 flex items-center justify-center p-8 pt-16 relative overflow-hidden">
               {state.isGenerating && (
                 <div className="absolute inset-0 z-20 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center">
                   <Spinner />
                 </div>
               )}

               {state.generatedImage ? (
                 <div className="relative group w-full h-full flex items-center justify-center">
                    <img 
                      src={state.generatedImage.imageUrl} 
                      alt="Generated" 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in duration-500"
                    />
                 </div>
               ) : (
                 <div className="text-center text-dark-muted/50 select-none">
                    <div className="w-20 h-20 bg-dark-card/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                       <MagicIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <p>Your reimagined design will appear here</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-card mt-12 py-8 text-center text-dark-muted text-sm">
        <p>Using Google Gemini 2.5 Flash Image Model</p>
      </footer>
    </div>
  );
};

export default App;