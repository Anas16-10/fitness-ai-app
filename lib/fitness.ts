// lib/fitness.ts
// Helper functions for common fitness calculations.
// These are pure functions, which means they only depend on their inputs
// and are easy to test and reuse across the app.

/**
 * Calculate Body Mass Index (BMI).
 *
 * BMI = weight (kg) / (height (m))^2
 * We expect weight in kilograms and height in centimeters,
 * so we first convert height from cm to meters.
 */
export function calculateBMI(weight: number, height: number): number {
  if (weight <= 0 || height <= 0) return 0;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 100) / 100; // round to 2 decimal places
}

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 *
 * This estimates how many calories your body burns at rest per day.
 *
 * For men:
 *   BMR = 10 * weight + 6.25 * height - 5 * age + 5
 * For women:
 *   BMR = 10 * weight + 6.25 * height - 5 * age - 161
 *
 * weight: kilograms, height: centimeters, age: years.
 */
export function calculateBMR(
  age: number,
  weight: number,
  height: number,
  gender: "male" | "female"
): number {
  if (age <= 0 || weight <= 0 || height <= 0) return 0;

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === "male" ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) using activity multiplier.
 *
 * TDEE = BMR * activity_multiplier
 *
 * Activity multipliers:
 * - sedentary: 1.2 (little/no exercise)
 * - light: 1.375 (light exercise 1-3 days/week)
 * - moderate: 1.55 (moderate exercise 3-5 days/week)
 * - active: 1.725 (hard exercise 6-7 days/week)
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: "sedentary" | "light" | "moderate" | "active"
): number {
  if (bmr <= 0) return 0;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  return Math.round(bmr * multipliers[activityLevel]);
}

/**
 * Calculate a simple daily calorie target based on goal.
 *
 * We start from BMR and then add or subtract a small amount:
 * - Muscle gain:  BMR + 300 kcal (small surplus)
 * - Fat loss:     BMR - 400 kcal (moderate deficit)
 * - Maintenance:  BMR (no change)
 *
 * @deprecated Use calculateDailyCaloriesFromTDEE instead for more accurate results.
 */
export function calculateDailyCalories(
  bmr: number,
  goal: "muscle_gain" | "fat_loss" | "maintenance"
): number {
  if (bmr <= 0) return 0;

  switch (goal) {
    case "muscle_gain":
      return Math.round(bmr + 300);
    case "fat_loss":
      return Math.round(bmr - 400);
    case "maintenance":
    default:
      return Math.round(bmr);
  }
}

/**
 * Calculate daily calorie target using TDEE (more accurate than BMR-based).
 *
 * TDEE accounts for activity level, making calorie targets more realistic:
 * - Muscle gain:  TDEE + 300 kcal (surplus for muscle building)
 * - Fat loss:     TDEE - 500 kcal (deficit for fat loss)
 * - Maintenance:  TDEE (maintain current weight)
 */
export function calculateDailyCaloriesFromTDEE(
  tdee: number,
  goal: "muscle_gain" | "fat_loss" | "maintenance"
): number {
  if (tdee <= 0) return 0;

  switch (goal) {
    case "muscle_gain":
      return Math.round(tdee + 300);
    case "fat_loss":
      return Math.round(tdee - 500);
    case "maintenance":
    default:
      return Math.round(tdee);
  }
}

/**
 * Calculate recommended macro targets based on total calorie goal.
 * 
 * Standard split:
 * - Protein: 30% (4 kcal/g)
 * - Carbs: 45% (4 kcal/g)
 * - Fat: 25% (9 kcal/g)
 */
export function calculateMacroTargets(calories: number) {
  if (calories <= 0) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: Math.round((calories * 0.30) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.25) / 9),
  };
}
