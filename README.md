# Fitness AI Coach

Fitness AI Coach is a comprehensive Next.js web application that leverages the power of AI (Google Gemini) to act as your personal fitness trainer and nutritionist. It automatically generates 7-day workout plans, offers daily dietary recommendations based on your logs, and provides a deep weekly progress report to ensure you stay on track.

## Features

- **Personalized AI Coach**: Uses `gemini-3.1-flash-lite-preview` to provide dynamic, realistic fitness and nutrition advice based on your profile inputs (Weight, Height, Age, Goal).
- **Workout Logging & Streak Tracking**: Log your daily exercises (sets, reps, weight). The built-in progressive overload advisor will suggest exactly when to increase weight or reps to avoid plateaus.
- **Nutrition Tracking**: Track your daily macros (Calories, Protein, Carbs, Fat).
- **Today's Plan Filtering**: The Daily AI Plan smartly filters out exercises you've already completed today.
- **Data Visualization**: View your progress through interactive Weekly Calorie, Protein, and Bodyweight charts built with Recharts.
- **Weekly Reporting**: Every Sunday, unlock a Deep Weekly Analysis button to analyze your past 7 days of performance and strategize for the next week.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Lucide React for crisp, modern icons
- **Database / Auth**: Supabase (PostgreSQL)
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)
- **Charts**: Recharts

## Setup Instructions

1. **Clone the repository.**
2. **Install local dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.1-flash-lite-preview
   ```
4. **Database Configuration**:
   Use the provided `supabase-migrations.sql` script to initialize the tables (`profiles`, `workout_logs`, `nutrition_logs`, `workout_plans`, `ai_recommendations`, `exercise_progress`) via the Supabase SQL Editor.
5. **Run the server**:
   ```bash
   npm run dev
   ```

## Workflow

1. **Profile Setup**: Complete your profile parameters to tune the AI model.
2. **Generate Pro Plan**: Go to the AI Coach section on your dashboard to request a 7-day personalized workout split.
3. **Log & Progress**: Go to "Log Workout" and track your sets. The AI generated schedule updates dynamically as you lift!
4. **Consistency**: Keep the streak alive every single day!
