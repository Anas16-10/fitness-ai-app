// components/nutrition/FoodSearch.tsx
// A small search form that lets the user look up a food in the
// USDA FoodData Central API and see basic nutrition info.
//
// Once a food is found, the user can click "Add Food" to send the
// data (plus a quantity) back to the parent component to be logged.

"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { searchFood, searchFoodsAutocomplete, USDAFoodResult } from "@/lib/usda";

interface FoodSearchProps {
  onAddFood: (food: USDAFoodResult & { quantity: string }) => void;
  onSaveFavorite?: (food: USDAFoodResult) => void;
}

export function FoodSearch({ onAddFood, onSaveFavorite }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("");
  const [result, setResult] = useState<USDAFoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    { name: string; calories: number; protein: number }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete search (500ms delay).
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(async () => {
        const results = await searchFoodsAutocomplete(query);
        setSuggestions(results);
        setShowSuggestions(true);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query) {
      setError("Please enter a food name.");
      return;
    }

    setError(null);
    setResult(null);
    setShowSuggestions(false);
    setLoading(true);
    try {
      const food = await searchFood(query);
      if (!food) {
        setError("No foods found. Try a different search term.");
      } else {
        setResult(food);
        // If no quantity has been entered yet, default to "1 serving".
        if (!quantity) {
          setQuantity("1 serving");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Could not fetch nutrition data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggestionClick(suggestion: {
    name: string;
    calories: number;
    protein: number;
  }) {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    // Auto-search when clicking a suggestion.
    try {
      const food = await searchFood(suggestion.name);
      if (food) {
        setResult(food);
        if (!quantity) {
          setQuantity("1 serving");
        }
      } else {
        setError("Could not fetch full nutrition data for this food.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Could not fetch nutrition data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Parse quantity to get multiplier
  function getQuantityMultiplier(qty: string): number {
    if (!qty || qty.trim() === "") return 1;
    const qtyLower = qty.toLowerCase().trim();
    const numberMatch = qtyLower.match(/(\d+\.?\d*)/);
    if (!numberMatch) return 1;
    const number = parseFloat(numberMatch[1]);
    if (
      qtyLower.includes("serving") ||
      qtyLower.includes("cup") ||
      qtyLower.includes("piece") ||
      qtyLower.includes("item")
    ) {
      return number;
    }
    if (number > 10 && qtyLower.includes("g")) {
      return number / 100; // Approximate: 100g = 1 serving
    }
    return number || 1;
  }

  function handleAdd() {
    if (result && quantity) {
      onAddFood({ ...result, quantity });
      // Keep the result visible but clear any previous errors.
      setError(null);
    } else {
      setError("Please search for a food and enter a quantity first.");
    }
  }

  return (
    <Card title="Search Food">
      <form onSubmit={handleSearch} className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <label className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Food name
            </label>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicks.
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 focus:border-blue-500 transition-all shadow-sm"
              placeholder="e.g. chicken breast"
              suppressHydrationWarning
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left text-xs text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/40 focus:bg-blue-50 focus:outline-none transition-all border-b border-gray-50 dark:border-slate-800 last:border-none"
                  >
                    <div className="font-black text-sm">{suggestion.name}</div>
                    <div className="text-gray-500 dark:text-slate-400 mt-1 font-bold">
                      {suggestion.calories} kcal <span className="mx-1">•</span> {suggestion.protein}g protein
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Quantity
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 focus:border-blue-500 transition-all shadow-sm"
              placeholder="e.g. 200g, 1 cup"
              suppressHydrationWarning
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !query}
          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {result && (
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-xs border border-slate-200 dark:border-slate-700 shadow-inner">
            <p className="mb-2 text-base font-black text-slate-900 dark:text-white leading-tight underline decoration-blue-500/20 underline-offset-4 decoration-2">{result.name}</p>
            {(() => {
              const multiplier = getQuantityMultiplier(quantity);
              const adjustedCalories = Math.round(result.calories * multiplier);
              const adjustedProtein = Math.round(result.protein * multiplier * 10) / 10;
              const adjustedCarbs = Math.round(result.carbs * multiplier * 10) / 10;
              const adjustedFat = Math.round(result.fat * multiplier * 10) / 10;
              return (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter text-[10px]">
                    Base values: {result.calories} kcal, {result.protein}g protein
                  </p>
                  {multiplier !== 1 && quantity && (
                    <p className="mt-2 font-black text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-sm leading-relaxed">
                      Total for "{quantity}": <br />
                      {adjustedCalories} kcal <span className="mx-1 opacity-50">•</span> {adjustedProtein}g P <span className="mx-1 opacity-50">•</span> {adjustedCarbs}g C <span className="mx-1 opacity-50">•</span> {adjustedFat}g F
                    </p>
                  )}
                  {multiplier === 1 && (
                    <p className="font-black text-slate-900 dark:text-white text-sm">
                      Total: {result.calories} kcal <span className="mx-1 opacity-50">•</span> {result.protein}g P <span className="mx-1 opacity-50">•</span> {result.carbs}g C <span className="mx-1 opacity-50">•</span> {result.fat}g F
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
              >
                Add to Log
              </button>
              {onSaveFavorite && (
                <button
                  type="button"
                  onClick={() => onSaveFavorite(result)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 shadow-md shadow-amber-200 dark:shadow-none transition-all active:scale-95"
                >
                  ⭐ Save Favorite
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}


