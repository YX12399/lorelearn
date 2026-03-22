# LoreLearn ✨

Personalized AI-generated animated episodes for autistic children. Every child is the hero of their own learning adventure.

## What it does

LoreLearn uses Claude Opus, fal.ai FLUX, Kling video, and ElevenLabs to generate fully personalized animated episodes:

1. **Profile** — Parent fills in the child's name, interests, sensory preferences, and emotional learning goals
2. **Story** — Claude Opus generates a personalized episode outline using the child's favorite things and the Zones of Regulation framework
3. **Images** — fal.ai FLUX generates scene-by-scene illustrations consistent with a character reference sheet
4. **Video** — Kling animates each scene from the generated images
5. **Voice** — ElevenLabs narrates each scene with a calm, age-appropriate voice
6. **Play** — The child watches their personalized episode with interactive pause points, emotion check-ins, and breathing exercises

## Design principles

- **Autism-friendly UX** — Calming color palette, predictable transitions, zero flashing
- **Zones of Regulation** — Blue / Green / Yellow / Red zone framework embedded in every episode
- **Sensory-safe** — Configurable visual sensitivity, audio sensitivity, pacing, and voice tone
- **Predictable structure** — Same navigation pattern across all episodes so children know what to expect

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Story generation | Anthropic Claude Opus (`@anthropic-ai/sdk`) |
| Image generation | fal.ai FLUX (`@fal-ai/client`) |
| Video generation | Kling via fal.ai |
| Voice narration | ElevenLabs (`elevenlabs`) |
| Animation | Framer Motion |
| State | Zustand + React hooks |
| Language | TypeScript (strict) |

## Project structure

```
src/
  app/
    page.tsx                        <- Landing page
    create/page.tsx                 <- Episode creation wizard
    dashboard/
      layout.tsx                    <- Sidebar nav
      page.tsx                      <- Dashboard overview
      children/                     <- Child profile management
      episodes/                     <- Episode library
      analytics/                    <- Progress tracking
    viewer/[episodeId]/page.tsx     <- Sensory-safe episode viewer
    api/
      story/route.ts                <- Claude Opus story generation
      images/route.ts               <- fal.ai image generation
      video/route.ts                <- Kling single-shot video
      video-multishot/route.ts      <- Kling multi-shot video
      voice/route.ts                <- ElevenLabs narration
      assets/character/route.ts     <- Character reference sheet generation
  components/
    ProfileForm.tsx                 <- Child profile form
    EpisodePlayer.tsx               <- Embedded episode player
    viewer/
      EmotionCheckIn.tsx            <- "How does [character] feel?" overlay
      ChoicePoint.tsx               <- "What should [character] do?" overlay
      BreathingExercise.tsx         <- Breathing bubble animation
  hooks/
    useStoryGeneration.ts           <- Story generation state management
    useVideoGeneration.ts           <- Full video pipeline state management
    useEpisodePlayer.ts             <- Playback, scene transitions, interactive moments
  lib/
    emotions.ts                     <- Zones of Regulation emotion library
    cohesion.ts                     <- Continuity bible + FFmpeg helpers
    story-generator.ts              <- Claude Opus prompt engineering
    image-generator.ts              <- fal.ai FLUX image generation
    video-generator.ts              <- Kling video generation
    voice-generator.ts              <- ElevenLabs voice generation
  types/
    index.ts                        <- Full TypeScript type system
```

## Getting started

### Prerequisites

- Node.js 20+
- API keys for Anthropic, fal.ai, and ElevenLabs

### Setup

```bash
git clone https://github.com/assumechat/lorelearn.git
cd lorelearn
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your_anthropic_key
FAL_KEY=your_fal_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

```bash
npm run dev
```

Open http://localhost:3000.

### API routes

| Route | Method | Description |
|---|---|---|
| `/api/story` | POST | Generate episode outline from child profile |
| `/api/images` | POST | Generate scene image with fal.ai FLUX |
| `/api/video` | POST | Animate a scene with Kling |
| `/api/video-multishot` | POST | Multi-shot Kling video |
| `/api/voice` | POST | Generate narration with ElevenLabs |
| `/api/assets/character` | POST | Generate character reference sheet |

## Environment variables

| Variable | Service | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic | Claude Opus story generation |
| `FAL_KEY` | fal.ai | FLUX images + Kling video |
| `ELEVENLABS_API_KEY` | ElevenLabs | Voice narration |

## Deployment

Deployed on Vercel. Push to `main` to trigger an automatic deployment.

```bash
git push origin main
```
