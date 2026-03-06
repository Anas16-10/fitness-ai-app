// lib/usda.ts
// Helper for talking to the USDA FoodData Central API.
// We use this to search for foods and extract basic nutrition info
// (calories, protein, carbs, fat) so we can log them in our app.

const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

const usdaApiKey = process.env.NEXT_PUBLIC_USDA_API_KEY;

if (!usdaApiKey) {
  console.warn(
    "NEXT_PUBLIC_USDA_API_KEY is not set. Food search will not work until you add it to .env.local."
  );
}

export interface USDAFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Search for a food by name using the USDA FoodData Central API.
 *
 * Example request that this function sends:
 *   GET https://api.nal.usda.gov/fdc/v1/foods/search?query=egg&api_key=YOUR_KEY
 *
 * The API returns a list of foods. Each food has a `description` and
 * a `foodNutrients` array. We look for specific nutrient names and
 * read their `value` fields:
 * - "Energy" (kcal)           → calories
 * - "Protein"                 → protein (g)
 * - "Carbohydrate, by difference" → carbs (g)
 * - "Total lipid (fat)"       → fat (g)
 */
/**
 * Search for multiple foods (for autocomplete suggestions).
 * Returns up to 5 results with basic info.
 */
export async function searchFoodsAutocomplete(
  query: string
): Promise<{ name: string; calories: number; protein: number }[]> {
  if (!usdaApiKey || !query.trim()) {
    return [];
  }

  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("api_key", usdaApiKey);
  url.searchParams.set("pageSize", "5");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = (await res.json()) as {
      foods?: {
        description?: string;
        foodNutrients?: { nutrientName?: string; value?: number }[];
      }[];
    };

    return (data.foods ?? []).map((food) => {
      const nutrients = food.foodNutrients ?? [];
      const getNutrient = (name: string) => {
        const n = nutrients.find(
          (item) => item.nutrientName?.toLowerCase() === name.toLowerCase()
        );
        return n?.value ?? 0;
      };

      return {
        name: food.description ?? "",
        calories: Math.round(getNutrient("Energy")),
        protein: Math.round(getNutrient("Protein")),
      };
    });
  } catch {
    return [];
  }
}

export async function searchFood(foodName: string): Promise<USDAFoodResult | null> {
  if (!usdaApiKey) {
    throw new Error(
      "NEXT_PUBLIC_USDA_API_KEY is missing. Add it to .env.local to use food search."
    );
  }

  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set("query", foodName);
  url.searchParams.set("api_key", usdaApiKey);
  url.searchParams.set("pageSize", "1");

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    console.error("USDA API error:", text);
    throw new Error("Failed to search food.");
  }

  const data = (await res.json()) as {
    foods?: {
      description?: string;
      foodNutrients?: { nutrientName?: string; value?: number; unitName?: string }[];
    }[];
  };

  const first = data.foods?.[0];
  if (!first) {
    // No results for this search term.
    return null;
  }

  const description = first.description ?? foodName;
  const nutrients = first.foodNutrients ?? [];

  function getNutrient(name: string): number {
    const n = nutrients.find(
      (item) => item.nutrientName && item.nutrientName.toLowerCase() === name.toLowerCase()
    );
    return n?.value ?? 0;
  }

  const calories = getNutrient("Energy");
  const protein = getNutrient("Protein");
  const carbs = getNutrient("Carbohydrate, by difference");
  const fat = getNutrient("Total lipid (fat)");

  return {
    name: description,
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}


