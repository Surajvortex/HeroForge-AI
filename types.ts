export interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export interface AppState {
  originalImage: string | null; // Base64 string
  originalMimeType: string;
  isGenerating: boolean;
  generatedImage: GeneratedImage | null;
  error: string | null;
}

export enum ImageActionType {
  UPLOAD_IMAGE,
  START_GENERATION,
  SUCCESS_GENERATION,
  FAIL_GENERATION,
  RESET,
}

export const SAMPLE_PROMPTS = [
  "Add a cyberpunk neon glow filter",
  "Make it look like a pencil sketch",
  "Remove the background and replace with a solid color",
  "Add a futuristic interface overlay",
  "Apply a vintage 80s retro style",
  "Turn this into a modern website hero section design"
];