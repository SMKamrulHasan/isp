/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, Sun, Contrast, CheckCircle2, AlertCircle } from 'lucide-react';
import { QualityMetrics } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface AnalysisPanelProps {
  metrics: QualityMetrics;
  insights: string[];
  title: string;
  className?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ metrics, insights, title, className }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8.0) return "text-emerald-400";
    if (score >= 6.0) return "text-orange-400";
    if (score >= 4.0) return "text-orange-500";
    return "text-red-500";
  };

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'sharpness': return <Zap size={14} />;
      case 'exposure': return <Sun size={14} />;
      case 'contrast': return <Contrast size={14} />;
      case 'noise': return <Activity size={14} />;
      case 'psnr': return <Activity size={14} />;
      case 'ssim': return <Activity size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const getMetricLabel = (key: string) => {
    switch (key) {
      case 'sharpness': return 'MTF Score';
      case 'exposure': return 'Luma EV';
      case 'contrast': return 'Dynamic Range';
      case 'noise': return 'Noise Floor';
      case 'psnr': return 'PSNR (dB)';
      case 'ssim': return 'SSIM Index';
      default: return key;
    }
  };

  const getMetricValueColor = (key: string, value: number) => {
    if (key === 'noise') {
      // Lower is better for noise. < 15% is professional.
      return value < 15 ? "bg-emerald-500" : value < 35 ? "bg-orange-500" : "bg-red-600";
    }
    if (key === 'psnr') {
      // 35dB+ is professional quality.
      return value > 35 ? "bg-emerald-500" : value > 25 ? "bg-orange-500" : "bg-red-600";
    }
    if (key === 'ssim') {
      // 0.98+ is near-perfect.
      return value > 0.98 ? "bg-emerald-500" : value > 0.93 ? "bg-orange-500" : "bg-red-600";
    }
    if (key === 'exposure') {
      // Luma EV: 40-70% is the "sweet spot" for professional exposure.
      return (value >= 40 && value <= 70) ? "bg-emerald-500" : (value > 20 && value < 85) ? "bg-orange-500" : "bg-red-600";
    }
    // Default (Sharpness, Contrast). 75%+ is sharp.
    return value > 75 ? "bg-emerald-500" : value > 50 ? "bg-orange-500" : "bg-red-600";
  };

  return (
    <div className={cn("glass rounded-[36px] p-8 border-white/10 shadow-2xl", className)}>
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-light mb-2">{title}</div>
          <div className="text-3xl font-bold text-white tracking-tight">Perceptual Index</div>
        </div>
        <div className="text-right">
          <div className={cn("text-6xl font-bold tracking-tighter leading-none", getScoreColor(metrics.nimaScore))}>
            {metrics.nimaScore.toFixed(1)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/20 font-light mt-2">PERCEPTUAL SCORE</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        {Object.entries(metrics).filter(([key]) => key !== 'nimaScore' && key !== 'latency').map(([key, value]) => (
          <div key={key} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-2 text-white/30 mb-4 group-hover:text-white/50 transition-colors">
              {getMetricIcon(key)}
              <span className="text-[10px] uppercase tracking-widest font-semibold">{getMetricLabel(key)}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-3">
              {key === 'psnr' ? `${value} dB` : key === 'ssim' ? value : `${value}%`}
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: key === 'psnr' ? `${(value as number / 50) * 100}%` : key === 'ssim' ? `${(value as number) * 100}%` : `${value}%` }}
                className={cn("h-full", getMetricValueColor(key, value as number))}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-white/5" />
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-light">Engineering Diagnostics</div>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        
        {insights.map((insight, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
          >
            <div className="mt-1">
              {(() => {
                const text = insight.toLowerCase();
                const negativeKeywords = [
                  'poor', 'lack', 'severe', 'issue', 'problem', 'loss', 
                  'obscuring', 'underexposed', 'overexposed', 'clipping', 
                  'artifact', 'distortion', 'softness', 'barely illuminated', 
                  'completely overshadow'
                ];
                
                // Keywords that are negative unless preceded by "no", "low", etc.
                const conditionalNegatives = ['noise', 'grain', 'blur'];
                
                const positiveKeywords = [
                  'excellent', 'good', 'well', 'sharp', 'clear', 'balanced', 
                  'minimal', 'suppressed', 'preserving', 'integrity', 'great',
                  'professional', 'ideal', 'effectively'
                ];

                // Check for explicit "no/low" noise/blur
                const isNegatedNegative = 
                  text.includes('no noticeable noise') || 
                  text.includes('virtually no noise') || 
                  text.includes('low noise') || 
                  text.includes('minimal noise') ||
                  text.includes('no issues') ||
                  (text.includes('blur') && (text.includes('background') || text.includes('depth of field')));
                
                const hasNegative = negativeKeywords.some(k => text.includes(k)) || 
                                   (conditionalNegatives.some(k => text.includes(k)) && !isNegatedNegative);
                
                const hasPositive = positiveKeywords.some(k => text.includes(k));
                
                // Default to positive only if it doesn't contain negative keywords
                if (hasNegative) {
                  return <AlertCircle size={20} className="text-orange-400 shrink-0" />;
                }
                
                return <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />;
              })()}
            </div>
            <div className="text-sm text-white/60 leading-relaxed font-normal">{insight}</div>
          </motion.div>
        ))}
      </div>

      {metrics.latency && (
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold">Processing Latency</div>
          <div className="text-xs font-mono text-white/40">{metrics.latency}ms</div>
        </div>
      )}
    </div>
  );
};
