import { GoogleGenAI, Type, GenerateContentParameters } from "@google/genai";
import { Course, Area, ModuleArea, CourseStatus, AreaBehavior } from "../types";

/**
 * Utility to call Gemini API with a simple retry logic for 429 (Rate Limit) errors.
 * Improved with more retries and longer backoff to handle quota constraints better.
 */
async function callWithRetry(
  ai: any,
  params: GenerateContentParameters,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || 
                          error?.status === 429 ||
                          errorMsg.toLowerCase().includes('quota') ||
                          errorMsg.toLowerCase().includes('too many requests');
      
      if (isRateLimit && i < maxRetries) {
        const delay = Math.pow(2, i) * 2000;
        console.warn(`Gemini API Rate Limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const getSystemPrompt = (courses: Course[], currentEcts: number, areas: Area[]) => {
  const areaRules = areas.map(a => 
    `- ${a.name}: Required ${a.required} ECTS. (${a.description})`
  ).join('\n');

  return `
You are an academic advisor for a Master's program (Development Studies).
Your goal is to analyze the student's current transcript and suggest the next logical steps.

REGULATIONS SUMMARY:
1. Total ECTS: 120.
${areaRules}

CURRENT STUDENT STATUS:
- Total ECTS Passed: ${currentEcts}
- Course History: ${JSON.stringify(courses.map(c => ({ name: c.name, area: c.area, status: c.status, group: c.subGroup })))}

INSTRUCTIONS:
- Identify missing compulsory modules or areas where ECTS are lacking.
- Check specific rules for areas (e.g., Module Groups).
- If close to 80 ECTS, mention Thesis requirements if applicable.
- Be encouraging but precise about the rules.
- Keep the response short (under 150 words).
`;
};

const WEATHER_CACHE_KEY = 'passau_weather_data_cache';
const WEATHER_CACHE_TTL = 30 * 60 * 1000;

export const getPassauWeather = async (): Promise<{ temp: number, condition: string }> => {
  try {
    const cachedStr = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cachedStr) {
      try {
        const { data, timestamp } = JSON.parse(cachedStr);
        if (Date.now() - timestamp < WEATHER_CACHE_TTL) {
          return data;
        }
      } catch (e) {
        localStorage.removeItem(WEATHER_CACHE_KEY);
      }
    }

    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await callWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: 'What is the current temperature and weather condition in Passau, Germany right now?',
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temp: { type: Type.NUMBER, description: "Temperature in Celsius" },
            condition: { type: Type.STRING, description: "Short condition (sunny, cloudy, rain, snow, mist)" }
          },
          required: ["temp", "condition"]
        }
      }
    });

    const text = response.text || '{"temp": 18, "condition": "sunny"}';
    const result = JSON.parse(text.trim());

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));

    return result;
  } catch (error: any) {
    console.warn("Weather Service Error:", error?.message || error);
    const staleCache = localStorage.getItem(WEATHER_CACHE_KEY);
    if (staleCache) {
      try { return JSON.parse(staleCache).data; } catch (e) {}
    }
    return { temp: 15, condition: "clear" };
  }
};

export const getAIAdvice = async (courses: Course[], areas: Area[]): Promise<string> => {
  try {
    const passedCourses = courses.filter(c => c.status === 'Passed');
    const currentEcts = passedCourses.reduce((sum, c) => sum + c.ects, 0);
    
    if (!process.env.API_KEY) return "Please configure your API_KEY to receive AI advice.";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await callWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: "Analyze my progress.",
      config: {
        systemInstruction: getSystemPrompt(courses, currentEcts, areas),
      }
    });

    return response.text || "Could not generate advice at this time.";
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      return "The academic advisor is currently busy (Quota exceeded). Please try again in a minute.";
    }
    console.error("AI Service Error:", error);
    return "The academic advisor is currently unavailable. Please check your network connection.";
  }
};

export const getAIReportSummary = async (courses: Course[], areas: Area[]): Promise<string> => {
  try {
    const passedCourses = courses.filter(c => c.status === 'Passed');
    const currentEcts = passedCourses.reduce((sum, c) => sum + c.ects, 0);
    
    if (!process.env.API_KEY) return "AI services unavailable (Missing API Key).";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const summaryData = {
      totalEcts: currentEcts,
      ectsNeeded: 120 - currentEcts,
      areas: areas.map(a => {
        const areaEcts = passedCourses.filter(c => c.area === a.id).reduce((s, c) => s + c.ects, 0);
        return { name: a.name, current: areaEcts, required: a.required };
      })
    };

    const prompt = `
      Context: A student in the M.A. Development Studies program at University of Passau.
      Task: Write a concise, professional executive summary of their academic performance for a minimalist report.
      Tone: Sophisticated, objective, and scholarly.
      Length: Exactly 40-60 words. No bullet points.
      Focus: Milestones achieved, credit accumulation trajectory, and standing relative to degree completion.
      Data: ${JSON.stringify(summaryData)}
    `;

    const response = await callWithRetry(ai, {
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        temperature: 0.8,
        systemInstruction: "You are an expert academic evaluator. You provide high-level summaries of student progress for formal transcripts."
      }
    });

    return response.text || "Journey analysis complete. Student maintains satisfactory progress towards graduation.";
  } catch (error) {
    console.error("AI Report Error:", error);
    return "The academic journey has been evaluated. Current data indicates consistent progression within the University of Passau's Development Studies framework.";
  }
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeCurriculumStructure = async (file: File): Promise<Area[]> => {
  if (!process.env.API_KEY) throw new Error("Missing API Key.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const docPart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this University curriculum document, module handbook page, or study regulations (Prüfungsordnung).
    The document may be an image or a PDF.
    
    IDENTIFY:
    1. Module Areas (e.g., "Basismodule", "Pflichtbereich", "Specialisation", "Wahlpflicht").
    2. Required ECTS for each identified area.
    3. Rules for completion (e.g., "must take 3 groups", "standard accumulation").
    
    FOR EACH AREA, PROVIDE:
    - id: A unique string ID.
    - name: The official title of the module group.
    - required: Integer ECTS target.
    - description: A short (10-15 word) summary of rules or courses within this block.
    - color: A Tailwind background color class that fits the theme (e.g., bg-indigo-500, bg-rose-500).
    - behavior: One of 'standard', 'groups', or 'thesis'.
    
    Return a strictly formatted JSON array. Accuracy in ECTS values is paramount.
  `;

  try {
    const response = await callWithRetry(ai, {
      model: 'gemini-3-pro-preview',
      contents: { parts: [docPart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              required: { type: Type.NUMBER },
              description: { type: Type.STRING },
              color: { type: Type.STRING },
              behavior: { 
                type: Type.STRING, 
                enum: ['standard', 'groups', 'thesis']
              }
            },
            required: ["id", "name", "required", "description", "color", "behavior"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Curriculum Analysis Error:", error);
    if (error?.message?.includes("EMPTY_RESPONSE")) throw new Error("The document was readable but no clear program structure was detected.");
    throw new Error("Analysis failed. Please ensure the document is a valid University curriculum overview.");
  }
};

export const parseTranscript = async (file: File): Promise<Partial<Course>[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Missing API Key. Please ensure the environment is configured correctly.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this academic transcript. Extract all courses listed.
    
    For each course:
    1. Extract name, ECTS, grade.
    2. Determine Semester.
    3. Categorize into areas (A, B, C, D, or Thesis).
    
    Accuracy is critical. Return empty array [] if unreadable.
  `;

  try {
    const response = await callWithRetry(ai, {
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ects: { type: Type.NUMBER },
              grade: { type: Type.NUMBER, nullable: true },
              semester: { type: Type.NUMBER },
              area: { type: Type.STRING },
              subGroup: { type: Type.STRING, nullable: true }
            },
            required: ["name", "ects", "area", "semester"]
          }
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("UNREADABLE_IMAGE");

    let rawData = JSON.parse(textResponse.trim());
    return rawData.map((item: any) => ({
      ...item,
      status: item.grade ? CourseStatus.Passed : CourseStatus.Planned,
      grade: item.grade || undefined
    }));
  } catch (error: any) {
    throw error;
  }
};
