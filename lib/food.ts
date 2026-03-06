// lib/food.ts
// Helpers for talking to the Edamam Nutrition API.
// We keep this logic in a separate file so that components can simply call
// `getFoodNutrition("200g chicken breast")` and get back calories + macros.

const EDAMAM_BASE_URL = "https://api.edamam.com/api/nutrition-data";

/**
 * Low-level helper that calls the Edamam API with our secret credentials.
 * This function should only be used on the server (e.g. in an API route)
 * because it reads EDAMAM_APP_ID and EDAMAM_APP_KEY from the environment.
 */
export async function fetchFoodNutritionFromAPI(query: string) {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "Missing EDAMAM_APP_ID or EDAMAM_APP_KEY. Add them to .env.local."
    );
  }

  const url = new URL(EDAMAM_BASE_URL);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("ingr", query);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    console.error("Edamam API error:", text);
    throw new Error("Failed to fetch nutrition data.");
  }

  const data = (await res.json()) as {
    calories?: number;
    totalNutrients?: {
      ENERC_KCAL?: { quantity?: number };
      PROCNT?: { quantity?: number };
      CHOCDF?: { quantity?: number };
      FAT?: { quantity?: number };
    };
  };

  const calories =
    data.totalNutrients?.ENERC_KCAL?.quantity ?? data.calories ?? 0;
  const protein = data.totalNutrients?.PROCNT?.quantity ?? 0;
  const carbs = data.totalNutrients?.CHOCDF?.quantity ?? 0;
  const fat = data.totalNutrients?.FAT?.quantity ?? 0;

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

/**
 * Client-friendly helper that our React components can call.
 *
 * Instead of talking to Edamam directly from the browser (which would leak
 * our API keys), we call our own Next.js API route. That route runs on the
 * server and uses `fetchFoodNutritionFromAPI` above.
 */
export async function getFoodNutrition(query: string) {
  const res = await fetch(
    `/api/food/nutrition?query=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Nutrition route error:", text);
    throw new Error("Failed to fetch nutrition data.");
  }

  const data = (await res.json()) as {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };

  return data;
}


