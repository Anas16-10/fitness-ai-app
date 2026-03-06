import React from 'react';

type MealSuggestion = {
    meal: string;
    suggestion: string;
};

type Macros = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

type DietPlanJSON = {
    daily_macro_targets: Macros;
    recommendations: string[];
    example_meals: MealSuggestion[];
    summary: string;
};

interface Props {
    data: DietPlanJSON;
}

export function DietPlanRenderer({ data }: Props) {
    if (!data?.daily_macro_targets) {
        return <p className="text-gray-500">Incomplete diet advice payload.</p>;
    }

    const { daily_macro_targets: macros, recommendations, example_meals, summary } = data;

    return (
        <div className="space-y-6">
            {summary && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                    <p className="text-emerald-800 text-sm font-medium">{summary}</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Calories</div>
                    <div className="text-lg font-bold text-gray-900">{macros.calories || 0}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                    <div className="text-xs text-blue-600 uppercase font-semibold mb-1">Protein</div>
                    <div className="text-lg font-bold text-blue-900">{macros.protein || 0}g</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                    <div className="text-xs text-green-600 uppercase font-semibold mb-1">Carbs</div>
                    <div className="text-lg font-bold text-green-900">{macros.carbs || 0}g</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                    <div className="text-xs text-orange-600 uppercase font-semibold mb-1">Fat</div>
                    <div className="text-lg font-bold text-orange-900">{macros.fat || 0}g</div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {example_meals && example_meals.length > 0 && (
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="p-1 bg-yellow-100 text-yellow-700 rounded-md">🍽️</span>
                            Example Meals
                        </h3>
                        <div className="space-y-3">
                            {example_meals.map((meal, idx) => (
                                <div key={idx} className="p-3 border rounded-lg bg-white shadow-sm flex flex-col">
                                    <span className="text-xs font-bold text-emerald-600 uppercase mb-1">{meal.meal}</span>
                                    <span className="text-sm text-gray-700">{meal.suggestion}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {recommendations && recommendations.length > 0 && (
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="p-1 bg-blue-100 text-blue-700 rounded-md">💡</span>
                            Recommendations
                        </h3>
                        <ul className="space-y-2">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span className="text-emerald-500 mt-0.5">•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
