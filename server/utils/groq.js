import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildPrompt = (dietaryCategory, state, district) => {
  const dietRules = {
    vegetarian: "pure vegetarian, no meat, no fish, no eggs",
    jain: "jain vegetarian - absolutely NO onion, NO garlic, NO root vegetables (potato, carrot, beetroot, radish), NO eggs, NO meat",
    eggetarian: "vegetarian plus eggs allowed, no meat, no fish",
    nonvegetarian: "all foods including meat, fish, eggs are allowed"
  };

  return `
You are a food water-footprint expert AI. Analyze this food image carefully.

USER DIET: ${dietRules[dietaryCategory]}
USER LOCATION: ${district}, ${state}, India

TASK:
1. Identify the food item(s) visible in the image
2. Calculate the approximate water footprint in liters to produce this meal/food item
3. Suggest 4-5 alternative food items that:
   - Use significantly LESS water to produce
   - Strictly follow the diet rule: ${dietRules[dietaryCategory]}
   - Are commonly available in ${district}, ${state}, India
   - Are culturally appropriate for the region

Return ONLY a valid JSON object, no markdown, no explanation, exactly this structure:
{
  "foodItemDetected": "Name of food detected",
  "waterUsedLiters": 1500,
  "alternatives": [
    {
      "name": "Food Alternative Name",
      "waterUsedLiters": 300,
      "waterSavedLiters": 1200,
      "description": "Short 1-line description of this food",
      "searchQuery": "food name available in ${district} ${state} restaurant"
    }
  ]
}

IMPORTANT:
- waterUsedLiters must be realistic (e.g., 1kg wheat = 1300L, 1kg rice = 2500L, 1kg chicken = 4300L, 1 egg = 200L, 1kg lentils = 900L)
- waterSavedLiters = waterUsedLiters(detected) - waterUsedLiters(alternative)
- searchQuery must be a natural Google Maps search string for finding that food locally
- For jain diet: never include onion, garlic, potato, carrot in alternatives
- Return ONLY the JSON, nothing else
`;
};

export const analyzeImageWithGroq = async (imageUrl, dietaryCategory, state, district) => {
  const prompt = buildPrompt(dietaryCategory, state, district);

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl }
          },
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const clean = raw.replace(/```json|```/gi, "").trim();
  return JSON.parse(clean);
};
