
import { GoogleGenAI, Type } from "@google/genai";
import { Scenario, ScenarioResult, AIConfig, TacticType } from '../types';

// Default config if none provided (Fallbacks)
const DEFAULT_GOOGLE_MODEL = 'gemini-2.5-flash';

/**
 * Main AI Service Router
 */
export const generateStateScenario = async (
  config: AIConfig,
  stateName: string,
  stateDesc: string,
  language: 'en' | 'zh'
): Promise<Scenario> => {
  
  const systemPrompt = `
    You are a cynical, Machiavellian political strategist for a game similar to 'House of Cards'.
    Create a high-stakes, slightly dark, or satirical political scenario for the US state of ${stateName} (${stateDesc}).
    The scenario should involve a difficult dilemma (corruption, local industry vs environment, scandal, or unrest).
    
    Provide 3 distinct options for the candidate.
    - One option should be 'populist' (pleasing the masses).
    - One should be 'aggressive' (attacking others).
    - One should be 'corrupt' or 'shady' (high risk/reward).
    
    ${language === 'zh' ? "Respond in Chinese." : "Respond in English."}
    Return ONLY valid JSON. Do not use Markdown code blocks.
  `;

  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      description: { type: "STRING" },
      options: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            strategy: { type: "STRING", enum: ['populist', 'intellectual', 'aggressive', 'diplomatic', 'corrupt'] }
          },
          required: ['text', 'strategy']
        }
      }
    },
    required: ['title', 'description', 'options']
  };

  return await callAI(config, systemPrompt, schema);
};

export const evaluateChoice = async (
  config: AIConfig,
  stateName: string,
  scenario: string,
  choice: string,
  strategy: string,
  tactic: TacticType,
  currentFunds: number,
  currentScandal: number,
  language: 'en' | 'zh'
): Promise<ScenarioResult> => {

  const systemPrompt = `
    The candidate is in ${stateName}.
    Scenario: "${scenario}"
    Candidate Choice: "${choice}" (Strategy: ${strategy})
    Tactic Used: "${tactic}" (Spin Doctor, Bribe, Smear, or None)
    Current Scandal Level: ${currentScandal}/100

    Evaluate the outcome realistically and cynically.
    - If Tactic is 'bribe', result MUST be positive polling but HIGH scandal increase.
    - If Tactic is 'spin', reduce any negative polling impact.
    - If Strategy is 'corrupt' and no cover-up, chance of huge scandal.
    - High scandal makes it harder to gain polling.

    Return JSON:
    - outcomeDescription: Narrative result.
    - pollingChange: -10 to +10.
    - fundChange: Donations gained or fines lost.
    - energyChange: -5 to -20.
    - scandalChange: -5 (good PR) to +20 (scandal).
    
    ${language === 'zh' ? "Respond in Chinese." : "Respond in English."}
    Return ONLY valid JSON. Do not use Markdown code blocks.
  `;

  const schema = {
    type: "OBJECT",
    properties: {
      outcomeDescription: { type: "STRING" },
      pollingChange: { type: "NUMBER" },
      fundChange: { type: "NUMBER" },
      energyChange: { type: "NUMBER" },
      scandalChange: { type: "NUMBER" }
    },
    required: ['outcomeDescription', 'pollingChange', 'fundChange', 'energyChange', 'scandalChange']
  };

  return await callAI(config, systemPrompt, schema);
};


/**
 * Private Helper to route calls based on provider
 */
async function callAI(config: AIConfig, prompt: string, schemaObj: any): Promise<any> {
  const { provider, apiKey, baseUrl, modelName } = config;

  if (provider === 'google') {
    return await callGoogle(apiKey, modelName, prompt, schemaObj);
  } else if (provider === 'claude' && !baseUrl?.includes('openrouter')) {
    // Direct Claude API
    return await callClaude(apiKey, baseUrl || 'https://api.anthropic.com/v1', modelName, prompt);
  } else {
    // OpenAI, DeepSeek, Ollama, Grok, OpenRouter share similar signatures
    return await callOpenAICompatible(apiKey, baseUrl, modelName, prompt);
  }
}

// --- Google Implementation ---
async function callGoogle(apiKey: string, model: string, prompt: string, schema: any) {
  const ai = new GoogleGenAI({ apiKey });
  
  // Simplified schema mapping for Google SDK
  const googleSchema = {
      type: Type.OBJECT,
      properties: Object.fromEntries(
          Object.entries(schema.properties).map(([k, v]: [string, any]) => {
              let t = Type.STRING;
              if (v.type === 'NUMBER') t = Type.NUMBER;
              if (v.type === 'ARRAY') t = Type.ARRAY;
              return [k, { ...v, type: t }];
          })
      ),
      required: schema.required
  };

  try {
    const res = await ai.models.generateContent({
      model: model || DEFAULT_GOOGLE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: googleSchema as any
      }
    });
    return JSON.parse(res.text || "{}");
  } catch (e) {
    console.error("Google AI Error", e);
    throw e;
  }
}

// --- OpenAI / DeepSeek / Ollama / OpenRouter Implementation ---
async function callOpenAICompatible(apiKey: string, baseUrl: string | undefined, model: string, prompt: string) {
  // 1. Construct URL
  // Ensure we don't end with double slashes. 
  // If baseUrl is provided (e.g. http://localhost:11434/v1), use it. 
  // Default to OpenAI.
  const base = baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://api.openai.com/v1';
  const url = `${base}/chat/completions`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  // Add specific headers for OpenRouter if detected
  if (url.includes('openrouter')) {
      headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      headers['X-Title'] = 'Campaign 270';
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }], // User role is safer for broad compatibility
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("No content in response");

    // 2. Clean Markdown
    // Many models (DeepSeek, Llama) wrap JSON in ```json ... ``` even if asked not to.
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Attempt to find JSON if there is extra text
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        content = content.substring(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(content);

  } catch (e: any) {
    console.error("OpenAI/Compatible AI Error", e);
    
    // Provide a more helpful error message for common CORS/Network issues
    if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
        let hint = "Check your internet connection.";
        if (url.includes('deepseek') || url.includes('openai') || url.includes('anthropic') || url.includes('x.ai')) {
             hint = "Browsers block direct access to this API (CORS). Please use 'OpenRouter' from the provider list instead.";
        } else if (url.includes('localhost')) {
             hint = "Ensure OLLAMA_ORIGINS=\"*\" is set when running Ollama.";
        }
        
        throw new Error(`Network Error: Failed to connect to ${base}. ${hint}`);
    }
    
    throw e;
  }
}

// --- Claude Implementation ---
async function callClaude(apiKey: string, baseUrl: string, model: string, prompt: string) {
    const url = `${baseUrl.replace(/\/+$/, '')}/messages`;
    
    const strictPrompt = `${prompt}\n\nIMPORTANT: Respond strictly with valid JSON only. Do not add markdown blocks.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'dangerously-allow-browser': 'true' // Client-side fetch
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 1024,
                messages: [
                    { role: "user", content: strictPrompt }
                ]
            })
        });

        if (!response.ok) {
             const err = await response.text();
             throw new Error(`Claude API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        // Cleanup markdown if present
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e: any) {
        console.error("Claude AI Error", e);
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
            throw new Error(`Network Error: Claude API blocked by browser CORS. Please use OpenRouter instead.`);
        }
        throw e;
    }
}
