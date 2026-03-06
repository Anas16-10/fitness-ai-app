// app/api/food/nutrition/route.ts
// This API route acts as a safe server-side proxy to the Edamam Nutrition API.
// The browser calls this route, and the route calls Edamam with our secret
// app_id and app_key from environment variables.

import { NextResponse } from "next/server";
import { fetchFoodNutritionFromAPI } from "@/lib/food";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchFoodNutritionFromAPI(query);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/food/nutrition:", error);
    return NextResponse.json(
      { error: "Failed to fetch nutrition data" },
      { status: 500 }
    );
  }
}


