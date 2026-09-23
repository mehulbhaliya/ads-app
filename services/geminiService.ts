import { GoogleGenAI, Part, Modality } from '@google/genai';
import { ROOM_TYPES, LIGHTING, STYLES } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageModel = 'gemini-2.5-flash-image-preview';
const textModel = 'gemini-2.5-flash';

const extractImageBase64 = (response: any): string => {
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part: Part) => part.inlineData
  );
  if (!imagePart || !imagePart.inlineData) {
    console.error("Gemini API response", response);
    const textPart = response.candidates?.[0]?.content?.parts?.find((p: Part) => p.text)?.text;
    throw new Error(`Could not find image in response. Gemini says: ${textPart || 'No text response.'}`);
  }
  return imagePart.inlineData.data;
};

const _generateRoomStagingSingle = async ({
  product, roomPrompt, roomType, style, lighting, aspectRatio, inspirationImages
}: {
  product: Part;
  roomPrompt: string;
  roomType: string;
  style: string;
  lighting: string;
  aspectRatio: string;
  inspirationImages: Part[];
}): Promise<string> => {
  let prompt = `An ultra-realistic, 4K photograph of the provided product, styled for a high-end catalog.
Render in a ${aspectRatio} aspect ratio.
The original product's material, structure, and details must be precisely preserved.
The final image should be indistinguishable from a commercial photograph shot on a Hasselblad camera.`;

  const hasTextPrompt = roomPrompt.trim().length > 0;
  const hasInspiration = inspirationImages.length > 0;

  if (hasTextPrompt) {
    prompt += `\nThe desired scene is described as: "${roomPrompt}".`;
  }
  if (hasInspiration) {
    prompt += `\nUse the provided reference images as strong inspiration for the room's style, color palette, and overall atmosphere.`;
  }
  if (!hasTextPrompt && !hasInspiration) {
    const settingParts = [style, roomType].filter(Boolean); // Filters out empty strings
    let settingDescription = settingParts.join(' ');

    if (settingDescription) {
        prompt += `\nThe setting is a ${settingDescription}`;
        if (lighting) {
            prompt += ` with ${lighting} lighting.`;
        }
        prompt += '.';
    } else if (lighting) {
        prompt += `\nThe setting should have ${lighting} lighting.`;
    }
  }
  
  const parts: Part[] = [product, ...inspirationImages, { text: prompt }];

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: { parts },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });

  return extractImageBase64(response);
};

export const generateRoomStagingVariants = async ({
  product, roomPrompt, baseRoomType, baseStyle, baseLighting, aspectRatio, inspirationImages
}: {
  product: Part;
  roomPrompt: string;
  baseRoomType: string;
  baseStyle: string;
  baseLighting: string;
  aspectRatio: string;
  inspirationImages: Part[];
}): Promise<string[]> => {
    
    // We will generate 3 variants.
    // 1. The user's specific request.
    // 2. A variation on lighting.
    // 3. A variation on room type.

    // Base parameters for variations. If user didn't specify, use a default.
    const roomTypeForVariations = baseRoomType || ROOM_TYPES[0];
    const lightingForVariations = baseLighting || LIGHTING[0];

    const variantParams = [
        // Variant 1: User's exact request (can have empty strings)
        { roomType: baseRoomType, style: baseStyle, lighting: baseLighting },
        
        // Variant 2: Change the lighting
        { 
            roomType: baseRoomType, 
            style: baseStyle, 
            lighting: LIGHTING.find(l => l !== lightingForVariations) || LIGHTING[1] || LIGHTING[0] 
        },

        // Variant 3: Change the room type
        { 
            roomType: ROOM_TYPES.find(r => r !== roomTypeForVariations) || ROOM_TYPES[1] || ROOM_TYPES[0], 
            style: baseStyle, 
            lighting: baseLighting 
        },
    ];

    // Remove duplicate parameter sets before making API calls
    // FIX: Wrapped JSON.stringify in an arrow function to avoid passing extra arguments from map.
    const uniqueParams = Array.from(new Set(variantParams.map(p => JSON.stringify(p)))).map(s => JSON.parse(s));

    const promises = uniqueParams.map(params => 
        _generateRoomStagingSingle({
            product,
            roomPrompt,
            aspectRatio,
            inspirationImages,
            ...params,
        })
    );

    return Promise.all(promises);
};

const PROMPTS = {
  photographic: (angle: string, quality: string, aspectRatio: string) => `
Recreate this exact piece of furniture from a "${angle}" view.
Render in a ${aspectRatio} aspect ratio.

**CRITICAL INSTRUCTIONS:**
1. **High Fidelity:** The recreated furniture must be identical to the original. Do not change its material, color, texture, dimensions, design, or any details.
2. **Angle:** Render the image from the specified angle only.
3. **Realism:** Ensure lighting, shadows, and scale are realistic.
4. **Background:** The output must be a professional product photo with a clean, neutral, light gray or off-white background suitable for e-commerce.
5. **Output Quality:** The final image must be clean, sharp, and in ${quality} resolution.
6. **No Deformation:** The furniture must not be warped, deformed, or have any altered design features. Consistency is key.
7. **Output:** Provide only the image of the furniture as requested.`,

  custom: (description: string, quality: string, aspectRatio: string) => `
Recreate this exact piece of furniture from the angle described below:
"${description}"
Render in a ${aspectRatio} aspect ratio.

**CRITICAL INSTRUCTIONS:**
1. **High Fidelity:** The recreated furniture must be identical to the original. Do not change its material, color, texture, dimensions, design, or any details.
2. **Angle:** Render the image from the specified custom angle only.
3. **Realism:** Ensure lighting, shadows, and scale are realistic.
4. **Background:** The output must be a professional product photo with a clean, neutral, light gray or off-white background suitable for e-commerce.
5. **Output Quality:** The final image must be clean, sharp, and in ${quality} resolution.
6. **No Deformation:** The furniture must not be warped, deformed, or have any altered design features. Consistency is key.
7. **Output:** Provide only the image of the furniture as requested.`,

  staging: (quality: string, aspectRatio: string) => `
Place this exact piece of furniture into a photorealistic, beautifully staged room setting that complements its style.
Render in a ${aspectRatio} aspect ratio.

**CRITICAL INSTRUCTIONS:**
1. **High Fidelity:** The furniture must remain identical to the original. Do not change its material, color, texture, dimensions, or design.
2. **Focus:** The furniture is the hero of the image. It should be the primary focal point.
3. **Realism:** The entire scene, including lighting, shadows, scale, and perspective, must be highly realistic and aesthetically pleasing.
4. **Composition:** Create a professional interior design shot. The room should look professionally decorated.
5. **Context:** The room should be appropriate for the furniture (e.g., a sofa in a living room, a bed in a bedroom).
6. **No Deformation:** The furniture must not be warped or deformed.
7. **Output Quality:** The final image must be ultra-realistic, with sharp details, and in ${quality} resolution.
8. **Output:** Provide only the final image of the furniture in the room setting.`,

  orthographic: (side: string, quality: string, aspectRatio: string) => `
Analyze the input image and focus on the ${side} design of the furniture piece.
Render in a ${aspectRatio} aspect ratio.

**CRITICAL INSTRUCTIONS:**
1. **Perspective Correction:** The output must be a perfectly straight, flat, orthographic view of the ${side}, as if you are looking directly at it.
2. **Remove Distortion:** Eliminate all perspective distortion from the original camera angle. The output should be like a technical drawing or blueprint.
3. **High Fidelity:** Preserve every single detail with extreme accuracy (dimensions, proportions, texture details).
4. **Background:** The background must be solid white (#FFFFFF) without any shadows or gradients.
5. **Output Quality:** Suitable for tracing in 3D modeling software, in ${quality} resolution.
6. **Output:** Provide a pure technical image of the ${side}.`,

  '360': (degree: number, frame: number, totalFrames: number, quality: string, aspectRatio: string) => `
Recreate this exact piece of furniture, viewed from a ${degree} degree horizontal rotation.
Render in a ${aspectRatio} aspect ratio.

**CRITICAL INSTRUCTIONS FOR 360° SEQUENCE:**
1. **Consistency is KEY:** This is frame ${frame} of a ${totalFrames}-frame 360-degree rotation. The object's scale, lighting, and position must remain perfectly consistent across all frames to create a smooth rotation.
2. **High Fidelity:** The recreated furniture must be identical to the original, with all texture, color, and material details.
3. **Centering:** The furniture should be perfectly centered in the frame.
4. **Background:** Use a clean, neutral, light gray or off-white background. The background must be identical in every frame.
5. **Lighting:** Ensure consistent lighting across all frames.
6. **Output Quality:** Each frame should be high-resolution, in ${quality}, suitable for creating a smooth animation.`,
};


export const generateCatalogAngle = async (product: Part, angle: { name: string, type: string }, quality: string, aspectRatio: string): Promise<string[]> => {
  let prompt = '';
  
  const singleImageGeneration = async (p: string) => {
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [product, { text: p }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return extractImageBase64(response);
  };

  switch (angle.type) {
    case 'photographic':
      prompt = PROMPTS.photographic(angle.name, quality, aspectRatio);
      const result = await singleImageGeneration(prompt);
      return [result];

    case 'custom':
      prompt = PROMPTS.custom(angle.name, quality, aspectRatio);
      const customResult = await singleImageGeneration(prompt);
      return [customResult];

    case 'staging':
      prompt = PROMPTS.staging(quality, aspectRatio);
      const stagingResult = await singleImageGeneration(prompt);
      return [stagingResult];

    case 'orthographic':
      const side = angle.name.includes('Left') ? 'left side' : 'right side';
      prompt = PROMPTS.orthographic(side, quality, aspectRatio);
      const orthoResult = await singleImageGeneration(prompt);
      return [orthoResult];
      
    case '360':
      const totalFrames = 12;
      const promises: Promise<string>[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const degree = i * (360 / totalFrames);
        const framePrompt = PROMPTS['360'](degree, i + 1, totalFrames, quality, aspectRatio);
        promises.push(singleImageGeneration(framePrompt));
      }
      return Promise.all(promises);

    default:
      throw new Error(`Unsupported angle type: ${angle.type}`);
  }
};


export const generateShadeFinish = async (product: Part, texture: Part, aspectRatio: string): Promise<string> => {
  const step1Prompt = `Analyze this texture image in extreme detail. Describe:
1. Material type (wood, metal, leather, etc.)
2. Surface finish (glossy, matte, semi-gloss, brushed, polished)
3. Texture pattern (grain, knots, veins, streaks, swirls)
4. Color palette (base color, secondary tones, highlights, undertones)
5. Light interaction (reflection, sheen, soft glow, diffuse)
6. Any small imperfections or natural features

The description should be vivid and precise so that another AI can **perfectly replicate this finish on a 3D object**. Use short, clear sentences for each property.`;
  
  const descriptionResponse = await ai.models.generateContent({
    model: textModel,
    contents: { parts: [texture, { text: step1Prompt }] },
  });

  const textureDescription = descriptionResponse.text;
  if (!textureDescription?.trim()) {
    throw new Error('Could not generate a description for the texture image.');
  }

  const step2Prompt = `Edit this product image to apply a new material finish described below. Render in a ${aspectRatio} aspect ratio.

"${textureDescription}"

Instructions:
1. Apply the finish **only to the main product surface** (seat, backrest, body, etc.).
2. Preserve the product's original shape, perspective, edges, shadows, and lighting.
3. Do not alter the background or any other objects.
4. Maintain natural light reflection and texture details of the original product.
5. Ensure the finish looks realistic, with proper color depth, shading, and surface details.
6. Output must be **photorealistic** and ready for catalog use.`;

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: { parts: [product, { text: step2Prompt }] },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });
  
  return extractImageBase64(response);
};


export const generateCountertop = async (product: Part, texture: Part, aspectRatio: string): Promise<string> => {
  const step1Prompt = `Analyze this countertop texture image carefully. Describe:
1. Material type (marble, granite, quartz, etc.)
2. Surface finish (polished, matte, honed, brushed)
3. Pattern and structure (veins, speckles, streaks, crystalline elements)
4. Color palette (dominant color, secondary tones, highlights, undertones)
5. Light interaction (reflective shine, gloss intensity, soft shadows)
6. Edge characteristics (smooth, beveled, rounded)

The description must be precise so that another AI can **replace only the countertop surface of a 3D product realistically**, without affecting other parts.`;
  
  const descriptionResponse = await ai.models.generateContent({
    model: textModel,
    contents: { parts: [texture, { text: step1Prompt }] },
  });

  const textureDescription = descriptionResponse.text;
  if (!textureDescription?.trim()) {
    throw new Error('Could not generate a description for the countertop texture image.');
  }

  const step2Prompt = `Replace ONLY the top surface of this product (countertop) with the material described below. Render in a ${aspectRatio} aspect ratio.

"${textureDescription}"

Instructions:
1. Preserve **legs, sides, backsplash, handles, and all other parts**.
2. Apply the finish realistically, aligning veins or patterns naturally with the countertop surface.
3. Maintain proper perspective, shadows, and natural lighting.
4. Keep the background unchanged.
5. Output must be **photorealistic**, with visible texture details and natural light reflection.
6. If the original product has edges, ensure the finish **wraps edges realistically**.`;

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: { parts: [product, { text: step2Prompt }] },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });
  
  return extractImageBase64(response);
};


export const modifyImage = async (base64Image: string, modificationText: string): Promise<string> => {
    const prompt = `This is an image editing task. The base image is provided. Apply a specific modification based on the following instruction, and return only the edited image. Instruction: "${modificationText}". Maintain the overall realism, perspective, and lighting of the original image unless the instruction specifies changing them.`;

    const imagePart: Part = {
        inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
        },
    };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    return extractImageBase64(response);
};