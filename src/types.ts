/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QualityMetrics {
  sharpness: number; // MTF Score 0-100
  exposure: number; // Luma EV 0-100
  contrast: number; // Dynamic Range 0-100
  noise: number; // Noise Floor 0-100
  psnr: number; // Peak Signal-to-Noise Ratio (dB)
  ssim: number; // Structural Similarity Index (0-1)
  nimaScore: number; // Perceptual Score 1-10
  latency?: number; // ms
}

export interface AnalysisResult {
  before: QualityMetrics;
  after: QualityMetrics;
  insights: string[];
  improvement: number; // percentage
}

export interface ImageSource {
  original: string; // base64 or URL
  processed: string; // base64 or URL
}
