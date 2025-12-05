import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProcessingResult, ElementType } from "../types";

// Schema definition for the expected JSON output
const layerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    label: { type: Type.STRING, description: "Short descriptive name (e.g., 'Man in red shirt', 'Game Title')" },
    type: { 
      type: Type.STRING, 
      enum: [
        ElementType.PERSON, 
        ElementType.OBJECT, 
        ElementType.TEXT, 
        ElementType.LOGO, 
        ElementType.BACKGROUND, 
        ElementType.EFFECT
      ] 
    },
    subtype: { type: Type.STRING, description: "More specific detail (e.g., 'Male', 'Sword', 'Grunge Overlay')" },
    confidence: { type: Type.NUMBER, description: "Confidence score 0.0 to 1.0" },
    ymin: { type: Type.NUMBER, description: "Bounding box top (0-1000 normalized to 0-1 later)" },
    xmin: { type: Type.NUMBER, description: "Bounding box left (0-1000)" },
    ymax: { type: Type.NUMBER, description: "Bounding box bottom (0-1000)" },
    xmax: { type: Type.NUMBER, description: "Bounding box right (0-1000)" },
    zIndex: { type: Type.INTEGER, description: "Layer order estimate (1 is background, 10 is foreground)" },
    dominantColor: { type: Type.STRING, description: "Hex color code of the element" }
  },
  required: ["label", "type", "ymin", "xmin", "ymax", "xmax", "zIndex", "dominantColor"]
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ruleOfThirdsScore: { type: Type.NUMBER, description: "Score 0-100 on how well it fits rule of thirds" },
    visualBalanceScore: { type: Type.NUMBER, description: "Score 0-100 on visual weight balance" },
    dominantColors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of hex codes" },
    brightnessMap: { type: Type.STRING, description: "Description of lighting distribution" },
    contrastLevel: { type: Type.STRING, description: "Low, Medium, High" },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 actionable design improvements" },
    eyeContact: { type: Type.BOOLEAN, description: "If a person is looking at the camera" },
    weightCenterX: { type: Type.NUMBER, description: "Center of visual mass X (0-100)" },
    weightCenterY: { type: Type.NUMBER, description: "Center of visual mass Y (0-100)" }
  },
  required: ["ruleOfThirdsScore", "visualBalanceScore", "dominantColors", "suggestions", "eyeContact"]
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    layers: { type: Type.ARRAY, items: layerSchema },
    analysis: analysisSchema
  },
  required: ["layers", "analysis"]
};

export const analyzeThumbnail = async (base64Image: string): Promise<ProcessingResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Using gemini-2.5-flash for speed and efficiency as requested
  // It is capable of object detection via bounding box reasoning
  const modelId = "gemini-2.5-flash";

  const prompt = `
    You are a professional graphic design AI tool named "Thumbnail Separator".
    
    Task: Deconstruct this YouTube/Gaming thumbnail into constituent visual layers.
    
    1. Detect every distinct element: People (primary, secondary), Text blocks, Objects, Logos, Backgrounds, Effects.
    2. Provide a precise bounding box for each element.
    3. Estimate the Z-index (stacking order) to separate foreground from background.
    4. Analyze the composition rules and provide critique.
    
    Return strict JSON matching the schema.
    For bounding boxes, use a scale of 0 to 1000.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for more deterministic/accurate analysis
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const rawData = JSON.parse(text);

    // Transform raw API data to our App types
    // Normalize coordinates from 0-1000 to 0-1
    const layers = rawData.layers.map((layer: any, index: number) => ({
      id: `layer-${index}-${Date.now()}`,
      label: layer.label,
      type: layer.type,
      subtype: layer.subtype,
      confidence: layer.confidence || 0.9,
      box: {
        ymin: layer.ymin / 1000,
        xmin: layer.xmin / 1000,
        ymax: layer.ymax / 1000,
        xmax: layer.xmax / 1000,
      },
      zIndex: layer.zIndex,
      dominantColor: layer.dominantColor,
      visible: true
    }));

    // Ensure there is at least a background layer if not detected
    const hasBackground = layers.some((l: any) => l.type === ElementType.BACKGROUND);
    if (!hasBackground) {
      layers.unshift({
        id: 'layer-bg-default',
        label: 'Background Environment',
        type: ElementType.BACKGROUND,
        confidence: 0.5,
        box: { ymin: 0, xmin: 0, ymax: 1, xmax: 1 },
        zIndex: 0,
        dominantColor: '#000000',
        visible: true
      });
    }

    // Sort layers by Z-index (ascending)
    layers.sort((a: any, b: any) => a.zIndex - b.zIndex);

    return {
      layers,
      analysis: {
        ruleOfThirdsScore: rawData.analysis.ruleOfThirdsScore,
        visualBalanceScore: rawData.analysis.visualBalanceScore,
        dominantColors: rawData.analysis.dominantColors,
        brightnessMap: rawData.analysis.brightnessMap || "Balanced",
        contrastLevel: rawData.analysis.contrastLevel || "Medium",
        suggestions: rawData.analysis.suggestions,
        eyeContact: rawData.analysis.eyeContact,
        visualWeightCenter: {
            x: rawData.analysis.weightCenterX || 50,
            y: rawData.analysis.weightCenterY || 50
        }
      }
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
