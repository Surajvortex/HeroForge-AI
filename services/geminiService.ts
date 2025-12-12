import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Edits an image using Gemini 2.5 Flash Image model.
 * @param base64Image The base64 encoded string of the source image (without the data:image/... prefix)
 * @param mimeType The mime type of the source image
 * @param prompt The text instruction for editing
 * @returns A promise resolving to the base64 data URL of the generated image
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // Note: nano banana models do not support responseMimeType or responseSchema config for images.
      // We rely on the model returning an image part.
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error("No response candidates returned from Gemini.");
    }

    const content = response.candidates[0].content;
    
    // Iterate through parts to find the image
    let generatedImageUrl = '';
    
    if (content.parts) {
        for (const part of content.parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                // Assuming PNG output usually, but respecting the returned mimeType if available (though usually inferred)
                // The SDK types might not explicitly state mimeType on inlineData return in all cases, 
                // but usually it's safe to assume generic image display or PNG for generated content.
                const responseMime = part.inlineData.mimeType || 'image/png'; 
                generatedImageUrl = `data:${responseMime};base64,${base64EncodeString}`;
                break; // Found the image, stop looking
            }
        }
    }

    if (!generatedImageUrl) {
         // If no image part found, check for text indicating refusal or error
         const textPart = content.parts?.find(p => p.text)?.text;
         if (textPart) {
             throw new Error(`Model returned text instead of image: ${textPart}`);
         }
         throw new Error("Model did not return a valid image.");
    }

    return generatedImageUrl;

  } catch (error: any) {
    console.error("Error generating image:", error);
    throw new Error(error.message || "Failed to edit image using Gemini.");
  }
};

/**
 * Helper to strip the data URL prefix (e.g., "data:image/png;base64,")
 */
export const extractBase64Data = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};