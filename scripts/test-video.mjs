const BASE_URL = "http://localhost:3000";

const PROFILE = {
  id: "test-sania",
  name: "Sania",
  age: 6,
  learningTopic: "Why do stars twinkle at night",
  learningLevel: "beginner",
  avatar: {
    hairColor: "black",
    hairStyle: "long wavy",
    skinTone: "warm brown",
    eyeColor: "dark brown",
    favoriteOutfit: "a purple dress with silver star patterns",
    distinguishingFeatures: ["dimples", "a small star-shaped hairpin"]
  },
  interests: {
    animals: ["cats", "butterflies", "owls"],
    foods: ["mangoes", "chocolate"],
    tvShows: ["Bluey"],
    games: ["hide and seek"],
    colors: ["purple", "silver", "blue"],
    places: ["garden", "stargazing hill"],
    specialInterests: ["stars", "planets", "constellations"],
    comfortObjects: ["stuffed owl toy"],
    musicGenres: ["lullabies"]
  },
  sensoryPreferences: {
    visualSensitivity: "medium",
    audioSensitivity: "medium",
    preferredPace: "medium",
    prefersDimColors: false,
    prefersSubtitles: true,
    prefersNarration: true,
    avoidFlashing: true,
    preferredVoiceTone: "warm"
  },
  emotionalGoals: ["curiosity", "wonder"]
};

async function testVideoGeneration() {
  console.log("=== LoreLearn Video Generation Test ===");
  console.log("Time:", new Date().toISOString());
  
  console.log("\n[1/4] Generating story script...");
  const storyRes = await fetch(BASE_URL + "/api/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile: PROFILE })
  });
  
  if (!storyRes.ok) {
    console.error("  Story FAILED:", storyRes.status, await storyRes.text());
    return;
  }
  
  const data = await storyRes.json();
  const episode = data.episode;
  console.log("  Title:", episode?.title);
  console.log("  Scenes:", episode?.scenes?.length);
  if (episode?.scenes) {
    episode.scenes.forEach((s, i) => {
      console.log("  Scene " + (i+1) + " narration:", (s.narration || "").substring(0, 100) + "...");
    });
  }

  const firstScene = episode?.scenes?.[0];
  if (!firstScene) { console.log("No scenes"); return; }
  
  console.log("\n[2/4] Generating image for scene 1...");
  const imgPrompt = firstScene.imagePrompt || firstScene.visualPrompt || firstScene.prompt;
  const imageRes = await fetch(BASE_URL + "/api/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: imgPrompt, provider: "fal", isFirstScene: true })
  });
  let imgUrl = null;
  if (imageRes.ok) {
    const imageData = await imageRes.json();
    imgUrl = imageData.url || imageData.imageUrl;
    console.log("  Image URL:", (imgUrl || "").substring(0, 120));
    console.log("  SUCCESS");
  } else {
    console.error("  Image FAILED:", imageRes.status, await imageRes.text());
    return;
  }
  
  console.log("\n[3/4] Generating voice narration...");
  const voiceRes = await fetch(BASE_URL + "/api/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: firstScene.narration, voiceTone: "warm" })
  });
  if (voiceRes.ok) {
    const voiceData = await voiceRes.json();
    console.log("  Audio URL:", (voiceData.url || voiceData.audioUrl || JSON.stringify(voiceData)).substring(0, 120));
    console.log("  SUCCESS");
  } else {
    console.error("  Voice FAILED:", voiceRes.status, await voiceRes.text());
  }
  
  console.log("\n[4/4] Submitting video generation job...");
  if (imgUrl) {
    const vidPrompt = firstScene.videoPrompt || firstScene.animationDirection || imgPrompt;
    const videoRes = await fetch(BASE_URL + "/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: imgUrl, prompt: vidPrompt, mode: "submit", provider: "fal" })
    });
    if (videoRes.ok) {
      const videoData = await videoRes.json();
      console.log("  Request ID:", videoData.requestId);
      console.log("  Status:", videoData.status);
      console.log("  SUCCESS - video queued");
    } else {
      console.error("  Video FAILED:", videoRes.status, await videoRes.text());
    }
  }

  console.log("\n=== Test Complete ===");
  console.log("Time:", new Date().toISOString());
}

testVideoGeneration().catch(console.error);
