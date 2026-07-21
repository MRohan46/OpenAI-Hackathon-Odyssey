# Odyssey

> **From Zero to Hero, One Quest at a Time.**

Odyssey is a gamified habit tracker and calendar that turns long-term goals into daily quests.

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
| Backend API | Vercel Functions |
| Database and authentication | Supabase |
| Photo-proof storage | Supabase Storage |
| AI roadmap generation | Groq |
| Reminders | Device notifications and in-app reminders |

Groq credentials stay behind a protected server-side boundary and are never embedded in the mobile application. User goals, completion history, and proof images remain private to their owner.

## Development setup

Use npm for installs and scripts. The committed `package-lock.json` is the sole dependency lockfile.

```bash
npm ci
npm run lint
npm run typecheck
npm test
```

## Visual Direction

Odyssey uses a **minimalistic beach-themed direction**: calm, open, focused, and adventurous without becoming noisy. The product should feel like beginning a long journey from a quiet shore.

## The Mission

Odyssey is not another place to collect checkmarks. It is a way to connect today's effort with tomorrow's goal.

The roadmap is clear. The final boss is still standing. That is fine—we know the next quest.

For the complete product description, read [docs/PRODUCT.md](docs/PRODUCT.md).

## Production data setup

Configured builds use Supabase as the source of truth for goals, quests, completions, rewards, private proof, notifications, and preferences. Groq-backed roadmap generation runs through the authenticated Vercel API. The complete data and security setup is in [docs/SUPABASE_PRODUCTION_IMPLEMENTATION.md](docs/SUPABASE_PRODUCTION_IMPLEMENTATION.md).

## Usage of Codex
We used Codex extensively throughout the development of our project, with GPT-5.6 playing a central role in both the technical implementation and the creative development process.

Codex helped us build the full application, including the core architecture, backend logic, frontend components, integrations, error handling, and testing workflows. We used it for complex coding tasks that required understanding relationships across multiple files rather than generating isolated snippets. It assisted with implementing features, debugging failures, restructuring code, resolving dependency issues, improving performance, and ensuring that new functionality remained consistent with the existing codebase.

A major area where Codex contributed was the creation of our interactive user interface. We used it to translate our product ideas into functional UI components, design responsive layouts, implement interactive states, refine animations, and improve the overall user experience. Instead of relying on static templates, we worked iteratively with Codex to explore creative interface concepts, test different interaction patterns, and turn those ideas into production-ready code.

Our workflow with Codex was highly collaborative and iterative. We provided detailed requirements, screenshots, architectural context, expected behaviours, and constraints. Codex then helped us break large features into smaller implementation steps, generate the necessary code, inspect related files, identify potential problems, and revise the implementation based on testing and feedback.

We also used Codex to investigate bugs across the application. It analysed error messages, traced issues through different parts of the system, suggested likely root causes, and implemented targeted fixes. For more complex tasks, it helped us reason about trade-offs between different approaches before selecting an implementation.

Beyond writing code, Codex supported our broader engineering workflow by helping us:

* Plan and structure complex features
* Generate and refactor frontend and backend code
* Create reusable UI components
* Implement responsive and interactive behaviour
* Debug runtime, integration, and build errors
* Improve code quality and maintainability
* Write tests and validation logic
* Review edge cases and failure scenarios
* Document technical decisions and application behaviour
* Rapidly prototype alternative solutions before final implementation

We did not use Codex as a one-click project generator. Instead, we treated it as an active development partner. We continuously reviewed its output, tested the code, refined prompts, supplied additional context, and made final technical and product decisions ourselves.

This workflow allowed us to move quickly without sacrificing creativity or technical depth. Codex gave us the ability to experiment with ambitious ideas, build a polished interactive experience, and handle complex engineering tasks within the limited timeframe of the hackathon.

Never add a Groq secret as an `EXPO_PUBLIC_*` value: Expo embeds those values in the mobile/web client. Store `GROQ_API_KEY` and `GROQ_MODEL` only in Vercel environment variables.
