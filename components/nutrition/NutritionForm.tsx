// components/nutrition/NutritionForm.tsx
// Simple manual form for logging a food entry (macros and calories)
// to the `nutrition_logs` table. The USDA-powered search and auto-fill
// live on the main Nutrition page; this form is kept as a basic fallback.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { getLocalDateString } from "@/lib/date-utils";

interface NutritionFormProps {
  onSaved?: () => void;
}

export function NutritionForm({ onSaved }: NutritionFormProps) {
  const [food, setFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [calories, setCalories] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !food ||
      !quantity ||
      protein === "" ||
      carbs === "" ||
      fat === "" ||
      calories === ""
    ) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to log nutrition.");
        return;
      }

      const todayStr = getLocalDateString();

      const { error: insertError } = await supabase
        .from("nutrition_logs")
        .insert({
          user_id: user.id,
          food_name: food,
          quantity,
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
          log_date: todayStr,
        });

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        return;
      }

      setSuccess("Nutrition entry logged!");
      setFood("");
      setQuantity("");
      setProtein("");
      setCarbs("");
      setFat("");
      setCalories("");

      if (onSaved) {
        onSaved();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Log Nutrition">
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Food
          </label>
          <input
            type="text"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            placeholder="Chicken and rice"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            placeholder="e.g. 1 cup, 150g"
          />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Protein (g)
            </label>
            <input
              type="number"
              min={0}
              value={protein}
              onChange={(e) =>
                setProtein(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Carbs (g)
            </label>
            <input
              type="number"
              min={0}
              value={carbs}
              onChange={(e) =>
                setCarbs(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Fat (g)
            </label>
            <input
              type="number"
              min={0}
              value={fat}
              onChange={(e) => setFat(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Calories
            </label>
            <input
              type="number"
              min={0}
              value={calories}
              onChange={(e) =>
                setCalories(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Nutrition"}
        </button>
      </form>
    </Card>
  );
}


