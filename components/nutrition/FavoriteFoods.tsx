"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { FavoriteFood } from "@/types/database";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";


interface FavoriteFoodsProps {
  onAddFood: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: string;
  }) => void;
  onRefresh?: () => void;
}

export function FavoriteFoods({ onAddFood, onRefresh }: FavoriteFoodsProps) {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favToDelete, setFavToDelete] = useState<string | null>(null);


  async function fetchFavorites() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to see favorites.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("favorite_foods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
    } else {
      setFavorites((data ?? []) as FavoriteFood[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchFavorites();

    const handleRefresh = () => fetchFavorites();
    window.addEventListener('refresh-favorites', handleRefresh);
    return () => window.removeEventListener('refresh-favorites', handleRefresh);
  }, []);

  async function handleDelete(id: string) {
    setFavToDelete(id);
    setIsModalOpen(true);
  }

  async function confirmDelete() {
    if (!favToDelete) return;

    const { error: deleteError } = await supabase
      .from("favorite_foods")
      .delete()
      .eq("id", favToDelete);

    if (deleteError) {
      alert("Failed to delete favorite: " + deleteError.message);
    } else {
      setFavorites((prev) => prev.filter((f) => f.id !== favToDelete));
      if (onRefresh) onRefresh();
    }

    setIsModalOpen(false);
    setFavToDelete(null);
  }


  function handleAddFavorite(favorite: FavoriteFood) {
    onAddFood({
      name: favorite.food_name,
      calories: favorite.calories,
      protein: favorite.protein,
      carbs: favorite.carbs,
      fat: favorite.fat,
      quantity: "1 serving",
    });
  }

  if (loading) {
    return (
      <Card title="Favorite Foods">
        <p className="text-xs text-gray-500 italic">Loading favorites...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Favorite Foods">
        <p className="text-xs text-red-500">{error}</p>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card title="Favorite Foods">
        <p className="text-xs text-gray-500">
          No favorites yet. Use the ⭐ button when searching foods to save them.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Favorite Foods">
      <div className="space-y-3">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="group flex items-center justify-between rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-sm transition-all hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md"
          >
            <div className="flex-1 text-left">
              <div className="text-sm font-black text-gray-900 dark:text-white leading-tight underline decoration-blue-500/20 underline-offset-2 decoration-2">{favorite.food_name}</div>
              <div className="mt-1 text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-tight">
                {favorite.calories} kcal <span className="mx-1 text-gray-300 dark:text-slate-700">•</span> {favorite.protein}g P
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleAddFavorite(favorite)}
                className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-[11px] font-black text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white border border-blue-100 dark:border-blue-800 shadow-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => handleDelete(favorite.id)}
                className="rounded-full p-2 text-gray-300 dark:text-slate-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
                title="Remove from favorites"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Remove Favorite?"
        message="Are you sure you want to remove this food from your favorites? You'll need to search for it again to re-add it."
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsModalOpen(false);
          setFavToDelete(null);
        }}
      />
    </Card>

  );
}

