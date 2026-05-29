/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Share2, ChevronLeft, Loader2, Sparkles, Activity } from 'lucide-react';
import { ComparisonSlider } from '@/src/components/ComparisonSlider';
import { CameraView } from '@/src/components/CameraView';
import { AnalysisPanel } from '@/src/components/AnalysisPanel';
import { calculateClassicalMetrics, analyzeWithAI, fuseMetrics, generateTargetReference, generateDifferenceHeatmap, simulateRawCapture } from '@/src/services/analyzer';
import { QualityMetrics, ImageSource } from '@/src/types';
import { cn } from '@/src/lib/utils';

const App: React.FC = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [images, setImages] = useState<ImageSource | null>(null);
  const [heatmap, setHeatmap] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState('ISP Tuning');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if server is healthy and key is configured
    fetch('/api/analyze', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) 
    })
      .then(res => {
        if (res.status === 500) {
          res.json().then(data => {
            if (data.error === "Server API key not configured") {
              const msg = data.details 
                ? `AI analysis disabled: ${data.details}` 
                : "Server API key is missing. AI analysis will be disabled.";
              setApiKeyError(msg);
            }
          });
        }
      })
      .catch(() => {
        // Silently fail, the actual analysis will show error if it fails
      });
  }, []);

  const urlToDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          handleCapture(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleCapture = async (imageDataUrl: string) => {
    setIsCameraOpen(false);
    setIsAnalyzing(true);
    const startTime = performance.now();
    
    // Use the actual input as the "Before" state
    const original = imageDataUrl;
    const processed = await generateTargetReference(imageDataUrl); 
    const diffHeatmap = await generateDifferenceHeatmap(original, processed);

    try {
      const classical = await calculateClassicalMetrics(original, processed);
      const aiResult = await analyzeWithAI(original);
      
      const finalMetrics = fuseMetrics(classical, aiResult);
      finalMetrics.latency = Math.round(performance.now() - startTime);

      setMetrics(finalMetrics);
      setInsights(aiResult.insights);
      setImages({ original, processed });
      setHeatmap(diffHeatmap);
      setError(null);
    } catch (err) {
      console.error("Analysis failed:", err);
      const msg = err instanceof Error ? err.message : "Analysis failed. Please check your connection and API key.";
      setError(msg);
      setImages(null);
      setMetrics(null);
      setHeatmap(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImages(null);
    setMetrics(null);
    setHeatmap(null);
    setInsights([]);
    setShowHeatmap(false);
  };

  const handleShare = async () => {
    if (!images) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Neural Vision Lab Analysis',
          text: 'Check out this image analysis from Neural Vision Lab!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-plum-950 text-white font-sans selection:bg-white/20">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImport} 
      />
      
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] orange-glow blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] red-glow blur-[120px] rounded-full opacity-40" />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] orange-glow blur-[100px] rounded-full opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-6 flex justify-between items-center bg-plum-950/60 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 trending-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-accent-pink/20">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Camera IQ Analyzer</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-light">Image Quality Debugging Suite</p>
          </div>
        </div>
        <div className="flex gap-3">
          {apiKeyError && (
            <div className="hidden md:flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-2xl border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
              API Key Missing
            </div>
          )}
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            <div className="w-2 h-2 bg-accent-orange rounded-full animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-white/60">PROTOTYPE v2.4</span>
          </div>
          <button className="p-3 glass hover:bg-white/10 rounded-2xl transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {apiKeyError && (
        <div className="fixed top-24 left-6 right-6 z-30 md:hidden">
          <div className="bg-rose-500/20 backdrop-blur-xl border border-rose-500/30 p-3 rounded-2xl text-rose-200 text-[10px] font-medium text-center uppercase tracking-widest">
            {apiKeyError}
          </div>
        </div>
      )}

      <main className="pt-28 px-6 pb-24 max-w-6xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!images && !isAnalyzing ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12"
            >
              <div className="relative group">
                <div className="absolute -inset-24 bg-accent-orange/20 blur-[140px] rounded-full group-hover:bg-accent-orange/30 transition-all duration-1000" />
                <div className="w-36 h-36 glass rounded-[44px] flex items-center justify-center relative border-white/10 shadow-2xl">
                  <Camera size={56} className="text-white/40" />
                </div>
              </div>
              
              <div className="space-y-6 max-w-2xl">
                <h2 className="text-4xl font-bold tracking-tight leading-tight">
                  Image Quality <span className="gradient-text">Diagnostics</span>
                </h2>
                <p className="text-white/60 text-xl leading-relaxed font-light">
                  Evaluate, explain, and compare image quality using perceptual ML models and classical metrics. Identify noise, blur, and exposure issues.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="flex-1 px-8 py-5 trending-gradient text-white rounded-[28px] font-medium text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-accent-orange/30"
                >
                  Launch Viewfinder
                </button>
                <button 
                  onClick={triggerImport}
                  className="flex-1 px-8 py-5 glass hover:bg-white/10 rounded-[28px] font-medium text-lg transition-all"
                >
                  Import Dataset
                </button>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl max-w-md w-full">
                  <p className="text-rose-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Lab Tags Simulation */}
              <div className="flex gap-3 pt-8">
                {['ISP Tuning', 'Neural Engine', 'Optics Lab'].map((tag) => (
                  <button 
                    key={tag} 
                    onClick={() => setActiveProfile(tag)}
                    className={cn(
                      "px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all cursor-pointer",
                      activeProfile === tag ? "trending-gradient text-white shadow-lg shadow-accent-orange/20" : "glass text-white/30 hover:text-white/50"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[70vh] space-y-10"
            >
              <div className="relative">
                <div className="absolute -inset-16 bg-accent-orange/20 blur-[80px] animate-pulse" />
                <Loader2 size={72} className="animate-spin text-white/20 relative" />
              </div>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold tracking-tight">Analyzing IQ Metrics</div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-light">Camera IQ Perceptual Engine</div>
                  <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest font-light">Calculating MTF • Luma EV • PSNR • SSIM Analysis</div>
                </div>
              </div>
            </motion.div>
          ) : images && metrics ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Comparison View */}
                <div className="lg:col-span-7 h-[500px] lg:h-[800px] relative">
                  <div className="absolute top-6 left-6 z-30 flex gap-2">
                    <button 
                      onClick={() => setShowHeatmap(false)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all",
                        !showHeatmap ? "bg-white text-black" : "bg-black/40 text-white/60 backdrop-blur-xl border border-white/10"
                      )}
                    >
                      Side-by-Side
                    </button>
                    <button 
                      onClick={() => setShowHeatmap(true)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all",
                        showHeatmap ? "bg-rose-500 text-white" : "bg-black/40 text-white/60 backdrop-blur-xl border border-white/10"
                      )}
                    >
                      Diff Heatmap
                    </button>
                  </div>

                  {showHeatmap && heatmap ? (
                    <div className="h-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative">
                      <img src={heatmap} alt="Difference Heatmap" className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10">
                        <div className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Difference Heatmap</div>
                        <div className="text-[8px] text-white/40 mt-1 uppercase tracking-widest">Red: High Variance • Blue: Low Variance</div>
                      </div>
                    </div>
                  ) : (
                    <ComparisonSlider 
                      before={images.original} 
                      after={images.processed} 
                      beforeLabel="Input Capture"
                      afterLabel="Target Reference"
                      className="h-full shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                    />
                  )}
                </div>

                {/* Analysis Panel */}
                <div className="lg:col-span-5 space-y-8">
                  <AnalysisPanel 
                    metrics={metrics} 
                    insights={insights} 
                    title={activeProfile}
                  />
                  
                  <button 
                    onClick={() => { setImages(null); setMetrics(null); }}
                    className="w-full p-6 glass hover:bg-white/10 rounded-[28px] text-white/80 font-bold transition-all flex items-center justify-center gap-3 group"
                  >
                    <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    Analyze Another Image
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Floating Navigation Simulation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="glass-dark px-8 py-4 rounded-[32px] flex items-center gap-10 shadow-2xl border-white/10">
          <button 
            onClick={handleReset}
            className="w-10 h-10 trending-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-accent-orange/20 cursor-pointer hover:scale-110 transition-transform"
          >
            <Sparkles size={20} />
          </button>
          <button 
            onClick={() => setIsCameraOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer hover:scale-110 transition-transform"
          >
            <Camera size={24} />
          </button>
          <button 
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer hover:scale-110 transition-transform"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Camera Overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-plum-950"
          >
            <CameraView 
              onCapture={handleCapture} 
              onClose={() => setIsCameraOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
