
import { Part } from '@google/genai';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove prefix: "data:image/jpeg;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64 = await fileToBase64(file);
    return {
        inlineData: {
            data: base64,
            mimeType: file.type,
        },
    };
};
