# Odyssey V1

> **From Zero to Hero, One Quest at a Time.**

Odyssey V1 is a gamified habit tracker and calendar that turns long-term goals into daily quests.

Most habit trackers record only whether a habit was completed. Odyssey also considers **priority, consistency, intensity, and meaningful progress**. It connects the work someone does today with the goal they want to reach months from now.

Users schedule habits and tasks, complete them as quests, build streaks, earn rewards, and progress through AI-generated roadmaps. Important milestones become mini-bosses. The completed goal becomes the final boss.

The game makes progress enjoyable. The calendar keeps it practical.

## How Odyssey Works

1. **Create a goal** — Describe the destination, deadline, availability, and current starting point.
2. **Build the roadmap** — Groq AI proposes ten editable levels with suggested habits and tasks.
3. **Schedule the journey** — Add quests to Odyssey's calendar with priorities, deadlines, recurrence, and planned intensity.
4. **Complete daily quests** — Record the actual effort and attach photo proof when a habit requires it.
5. **Earn progress** — Build streaks, gain XP and rubies, open chests, and reduce boss health.
6. **Defeat the final boss** — Complete level 10 and finish the goal the roadmap was built around.

## Core Features

- **Odyssey Calendar** for habits, one-time tasks, recurring schedules, and deadlines
- **Daily Quest Board** that keeps the most important work visible
- **Four priority levels:** Low, Medium, High, and Critical
- **Intensity tracking:** Light, Normal, and Intense sessions
- **Device and in-app reminders** for upcoming and overdue quests
- **Configurable photo proof** for habits that need stronger accountability
- **Multiple active goals**, each with its own roadmap and final boss
- **Editable AI planning** instead of blindly activating generated schedules
- **Ten-level roadmaps** with mini-bosses at levels 3, 6, and 8
- **XP and account levels** that preserve permanent progress
- **Habit streaks and an overall Odyssey streak**
- **Rubies, reward chests, boosts, streak protection, and cosmetics**
- **Progress analytics** across the complete account, individual habits, and individual goals

## Progress Without Punishment

Odyssey keeps users accountable without erasing work they already earned.

Missing a required quest can break a streak and lose that quest's available rewards. It does not remove existing XP, erase completed roadmap stages, or restore defeated boss health. A missed day remains honest, but the next useful step remains visible.

## Technology

| Layer | Technology |
| --- | --- |
| Mobile application | React Native |
| Development platform | Expo SDK 57 |
| Language | TypeScript |
| Backend and authentication | Supabase |
| Photo-proof storage | Supabase Storage |
| AI roadmap generation | Groq |
| Reminders | Device notifications and in-app reminders |

Groq credentials stay behind a protected server-side boundary and are never embedded in the mobile application. User goals, completion history, and proof images remain private to their owner.

## Visual Direction

Odyssey uses a **minimalistic beach-themed direction**: calm, open, focused, and adventurous without becoming noisy. The product should feel like beginning a long journey from a quiet shore.

## The Mission

Odyssey is not another place to collect checkmarks. It is a way to connect today's effort with tomorrow's goal.

The roadmap is clear. The final boss is still standing. That is fine—we know the next quest.

For the complete product description, read [docs/PRODUCT.md](docs/PRODUCT.md).
