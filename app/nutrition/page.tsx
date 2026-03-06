"use client";

// app/nutrition/page.tsx
// Nutrition page where users can search foods via the USDA API,
// log them to Supabase, see today's foods, delete entries, and view
// daily macro totals (similar to a mini MyFitnessPal).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { getLocalDateString } from "@/lib/date-utils";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { FoodTable } from "@/components/nutrition/FoodTable";
import { NutritionTotals } from "@/components/nutrition/NutritionTotals";
import { FavoriteFoods } from "@/components/nutrition/FavoriteFoods";
import { AICoach } from "@/components/ai/AICoach";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { NutritionLog, Profile } from "@/types/database";

import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCaloriesFromTDEE,
  calculateMacroTargets,
} from "@/lib/fitness";



export default function NutritionPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [foods, setFoods] = useState<NutritionLog[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);
  const [targetMacros, setTargetMacros] = useState<{ protein: number; carbs: number; fat: number } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<string | null>(null);



  // Ensure the user is logged in and capture their ID.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUserId(data.user.id);
      }
    });
  }, [router]);

  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(getLocalDateString());
  }, []);

  // Load today's foods for this user.
  async function loadFoods(currentUserId: string) {
    setLoadingFoods(true);
    setError(null);

    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("log_date", todayStr)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setError("Failed to load today's foods.");
    } else {
      setFoods((data ?? []) as NutritionLog[]);
    }

    setLoadingFoods(false);
  }

  // Load profile to compute a daily calorie target (if possible).
  async function loadTargetCalories(currentUserId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("age, height, weight, goal, gender, activity_level")
      .eq("id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      const { age, height, weight, goal, gender, activity_level } = data;

      if (
        age &&
        height &&
        weight &&
        (gender === "male" || gender === "female") &&
        goal
      ) {
        const bmr = calculateBMR(age, weight, height, gender);

        let target = 0;
        if (activity_level) {
          const tdee = calculateTDEE(bmr, activity_level as any);
          target = calculateDailyCaloriesFromTDEE(tdee, goal as any);
        } else {
          // Fallback to simple goal-based adjustment if activity level missing
          target = bmr + (goal === "muscle_gain" ? 300 : goal === "fat_loss" ? -500 : 0);
        }

        setTargetCalories(target);
        setTargetMacros(calculateMacroTargets(target));
      }
    }
  }


  useEffect(() => {
    if (userId) {
      loadFoods(userId);
      loadTargetCalories(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, todayStr]);

  async function handleSaveFavorite(food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) {
    if (!userId) return;

    // Check for existing favorite to prevent duplicates
    const { data: existing } = await supabase
      .from("favorite_foods")
      .select("id")
      .eq("user_id", userId)
      .eq("food_name", food.name)
      .maybeSingle();

    if (existing) {
      alert("This food is already in your favorites!");
      return;
    }

    const { error } = await supabase.from("favorite_foods").insert({
      user_id: userId,
      food_name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });

    if (error) {
      console.error("Error saving favorite:", error);
    } else {
      // Refresh the child component implicitly if needed, 
      // though FavoriteFoods has its own effect.
      // We'll trigger a re-render or just let the effect handle it.
      // For immediate feedback, we can force a state refresh.
      window.dispatchEvent(new Event('refresh-favorites'));
    }
  }

  // Parse quantity string to extract multiplier (e.g., "2 servings" → 2, "200g" → calculate)
  function parseQuantityMultiplier(quantity: string, baseCalories: number): number {
    if (!quantity || quantity.trim() === "") return 1;

    const quantityLower = quantity.toLowerCase().trim();

    // Try to extract a number from the quantity string
    // Examples: "2 servings" → 2, "1.5 cups" → 1.5, "200g" → need to calculate
    const numberMatch = quantityLower.match(/(\d+\.?\d*)/);
    if (!numberMatch) return 1;

    const number = parseFloat(numberMatch[1]);

    // If quantity contains "serving" or "cup" or similar, use the number directly
    if (
      quantityLower.includes("serving") ||
      quantityLower.includes("cup") ||
      quantityLower.includes("piece") ||
      quantityLower.includes("item")
    ) {
      return number;
    }

    // If quantity contains weight (g, kg, oz, lb), we'd need base serving size
    // For now, if it's just a number without unit, assume it's servings
    // Otherwise, default to 1 (user can manually adjust)
    if (quantityLower.match(/\d+\s*(g|kg|oz|lb)/)) {
      // For weight-based quantities, we'd need the base serving weight
      // For simplicity, if user enters "200g" and base is "100g per serving",
      // multiplier would be 2. But we don't have base serving size.
      // So we'll use a simple heuristic: if number > 10, assume it's grams
      // and divide by 100 (assuming ~100g per serving)
      if (number > 10 && quantityLower.includes("g")) {
        return number / 100; // Approximate: 100g = 1 serving
      }
      return 1; // Default to 1 serving if we can't calculate
    }

    // If just a number, assume it's servings
    return number;
  }

  async function handleAddFood(food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: string;
  }) {
    if (!userId) return;

    setError(null);

    // Calculate multiplier based on quantity
    const multiplier = parseQuantityMultiplier(food.quantity, food.calories);

    // Multiply nutrition values by the multiplier
    const adjustedCalories = Math.round(food.calories * multiplier);
    const adjustedProtein = Math.round(food.protein * multiplier * 10) / 10; // Round to 1 decimal
    const adjustedCarbs = Math.round(food.carbs * multiplier * 10) / 10;
    const adjustedFat = Math.round(food.fat * multiplier * 10) / 10;

    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: userId,
      food_name: food.name,
      quantity: food.quantity,
      calories: adjustedCalories,
      protein: adjustedProtein,
      carbs: adjustedCarbs,
      fat: adjustedFat,
      log_date: todayStr,
    });

    if (error) {
      console.error(error);
      setError("Failed to add food. Please try again.");
      return;
    }

    await loadFoods(userId);
  }

  async function handleDeleteFood(id: string) {
    setFoodToDelete(id);
    setIsModalOpen(true);
  }

  async function confirmDeleteFood() {
    if (!userId || !foodToDelete) return;

    setError(null);

    const { error } = await supabase
      .from("nutrition_logs")
      .delete()
      .eq("id", foodToDelete);

    if (error) {
      console.error(error);
      setError("Failed to delete entry. Please try again.");
    } else {
      await loadFoods(userId);
    }

    setIsModalOpen(false);
    setFoodToDelete(null);
  }


  const totals = useMemo(() => {
    return foods.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [foods]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 text-3xl font-black text-slate-950 dark:text-white tracking-tight drop-shadow-sm">Nutrition</h1>

        <section className="mb-4">
          <FoodSearch onAddFood={handleAddFood} onSaveFavorite={handleSaveFavorite} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {loadingFoods ? (
            <p className="text-xs text-gray-500">Loading today's foods...</p>
          ) : (
            <FoodTable foods={foods} onDelete={handleDeleteFood} />
          )}
          <NutritionTotals
            calories={totals.calories}
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            targetCalories={targetCalories}
            targetMacros={targetMacros}
          />

        </section>

        <div className="mt-8">
          <FavoriteFoods onAddFood={handleAddFood} />
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
          <AICoach mode="diet" />
        </div>


        {error && (
          <p className="mt-3 text-xs text-red-500">
            {error}
          </p>
        )}
      </main>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Delete Food Entry?"
        message="Are you sure you want to remove this food from your log? This will update your daily totals."
        onConfirm={confirmDeleteFood}
        onCancel={() => {
          setIsModalOpen(false);
          setFoodToDelete(null);
        }}
      />
    </div>

  );
}

