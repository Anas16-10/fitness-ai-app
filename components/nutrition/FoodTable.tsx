// components/nutrition/FoodTable.tsx
// Shows today's logged foods in a simple table, with a delete button
// for each row so users can remove entries.

"use client";

import { NutritionLog } from "@/types/database";
import { Card } from "@/components/ui/Card";

interface FoodTableProps {
  foods: NutritionLog[];
  onDelete: (id: string) => void;
}

export function FoodTable({ foods, onDelete }: FoodTableProps) {
  return (
    <Card title="Today's Foods">
      {foods.length === 0 ? (
        <p className="text-xs text-gray-500">
          No foods logged yet today. Search above to add your first entry.
        </p>
      ) : (
        <div className="max-h-80 overflow-x-auto overflow-y-auto text-xs no-scrollbar">

          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] text-gray-500">
                <th className="py-1 pr-2 text-left">Food</th>
                <th className="py-1 pr-2 text-left">Quantity</th>
                <th className="py-1 pr-2 text-right">Calories</th>
                <th className="py-1 pr-2 text-right">Protein</th>
                <th className="py-1 pr-2 text-right">Carbs</th>
                <th className="py-1 pr-2 text-right">Fat</th>
                <th className="py-1 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 bg-white">
                  <td className="py-2 pr-2 align-top text-gray-900 font-bold">{item.food_name}</td>
                  <td className="py-2 pr-2 align-top text-gray-700 font-medium">
                    {item.quantity}
                  </td>
                  <td className="py-2 pr-2 text-right align-top text-gray-900 font-bold">
                    {item.calories}
                  </td>
                  <td className="py-2 pr-2 text-right align-top text-gray-700 font-medium">
                    {item.protein} g
                  </td>
                  <td className="py-2 pr-2 text-right align-top text-gray-700 font-medium">
                    {item.carbs} g
                  </td>
                  <td className="py-2 pr-2 text-right align-top text-gray-700 font-medium">
                    {item.fat} g
                  </td>
                  <td className="py-1 pl-2 text-right align-top">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="rounded-md border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}


