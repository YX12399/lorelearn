import { EmotionEntry, ZoneOfRegulation } from '@/types';

export const EMOTION_LIBRARY: Record<string, EmotionEntry> = {
  happy: {
    name: 'Happy',
    zone: 'green',
    bodySignals: ['smiling', 'relaxed muscles', 'warm feeling in chest', 'energy in legs'],
    visualCues: ['bright eyes', 'upturned mouth corners', 'open posture', 'light movements'],
    copingStrategies: ['share happiness with others', 'do a happy dance', 'draw how you feel'],
    validationPhrases: ["It's wonderful to feel happy!", 'Your smile is contagious!', 'I love seeing you happy!'],
    complexity: 'basic',
    relatedEmotions: ['excited', 'proud', 'grateful'],
  },
  calm: {
    name: 'Calm',
    zone: 'green',
    bodySignals: ['slow breathing', 'relaxed shoulders', 'quiet mind', 'soft muscles'],
    visualCues: ['gentle expression', 'relaxed face', 'steady breathing', 'still body'],
    copingStrategies: ['deep breathing', 'gentle stretching', 'quiet activity'],
    validationPhrases: ["Being calm feels so good", "You're doing great staying calm", 'This is a peaceful feeling'],
    complexity: 'basic',
    relatedEmotions: ['peaceful', 'content', 'relaxed'],
  },
  excited: {
    name: 'Excited',
    zone: 'yellow',
    bodySignals: ['fast heartbeat', 'butterflies in stomach', 'want to jump', 'talking fast'],
    visualCues: ['wide eyes', 'big smile', 'bouncy movements', 'raised eyebrows'],
    copingStrategies: ['take 3 deep breaths', 'squeeze a comfort object', 'count to 10 slowly'],
    validationPhrases: ['Excitement is a big feeling!', "It's okay to feel so excited!", "Let's use that energy!"],
    complexity: 'basic',
    relatedEmotions: ['happy', 'nervous', 'eager'],
  },
  worried: {
    name: 'Worried',
    zone: 'yellow',
    bodySignals: ['tight tummy', 'fast breathing', 'tense shoulders', 'racing thoughts'],
    visualCues: ['furrowed brow', 'biting lip', 'hunched shoulders', 'fidgeting'],
    copingStrategies: ['belly breathing', 'talk to a trusted adult', 'think of something safe', 'squeeze a fidget toy'],
    validationPhrases: ["It's okay to feel worried", 'Your feelings make sense', 'We can figure this out together'],
    complexity: 'intermediate',
    relatedEmotions: ['scared', 'nervous', 'anxious'],
  },
  frustrated: {
    name: 'Frustrated',
    zone: 'yellow',
    bodySignals: ['tight muscles', 'clenched fists', 'hot face', 'want to yell'],
    visualCues: ['frowning', 'tense jaw', 'rigid posture', 'rapid movements'],
    copingStrategies: ['take a break', 'squeeze something soft', 'blow out birthday candles breath', 'ask for help'],
    validationPhrases: ['Feeling frustrated is hard', "It makes sense you're frustrated", "Let's find a way through this"],
    complexity: 'intermediate',
    relatedEmotions: ['angry', 'disappointed', 'overwhelmed'],
  },
  sad: {
    name: 'Sad',
    zone: 'blue',
    bodySignals: ['heavy body', 'slow movements', 'teary eyes', 'quiet voice'],
    visualCues: ['downturned mouth', 'drooping shoulders', 'looking down', 'slow blinking'],
    copingStrategies: ['find a cozy spot', 'hug a comfort object', 'talk to someone who cares', 'draw your feelings'],
    validationPhrases: ["It's okay to feel sad", "I'm here with you", "Sad feelings don't last forever"],
    complexity: 'basic',
    relatedEmotions: ['lonely', 'disappointed', 'hurt'],
  },
  tired: {
    name: 'Tired',
    zone: 'blue',
    bodySignals: ['heavy eyelids', 'slow movements', 'yawning', 'hard to think'],
    visualCues: ['droopy eyes', 'slow blinking', 'slumped posture', 'quiet'],
    copingStrategies: ['rest or nap', 'quiet activity', 'drink water', 'gentle movement'],
    validationPhrases: ['Your body needs rest', 'Being tired is okay', "Let's find a quiet moment"],
    complexity: 'basic',
    relatedEmotions: ['calm', 'sad', 'overwhelmed'],
  },
  angry: {
    name: 'Angry',
    zone: 'red',
    bodySignals: ['very hot face', 'pounding heart', 'tight everything', 'want to hit or throw'],
    visualCues: ['red face', 'clenched fists', 'tense entire body', 'loud voice or silence'],
    copingStrategies: ['take space away from others', 'stomp feet on floor', 'squeeze a pillow hard', 'tell a trusted adult'],
    validationPhrases: ["It's okay to feel angry", 'Your anger makes sense', "Let's help your body feel safe"],
    complexity: 'intermediate',
    relatedEmotions: ['frustrated', 'scared', 'hurt'],
  },
  overwhelmed: {
    name: 'Overwhelmed',
    zone: 'red',
    bodySignals: ['everything feels too much', 'hard to breathe', 'want to escape', 'frozen or running'],
    visualCues: ['covering ears or eyes', 'rocking', 'frozen expression', 'shutdown'],
    copingStrategies: ['go to a safe quiet place', 'use noise-canceling headphones', 'squeeze comfort object very hard', 'box breathing'],
    validationPhrases: ['This is a lot right now', "Let's find your calm place", 'You are safe', "I'm right here"],
    complexity: 'advanced',
    relatedEmotions: ['anxious', 'scared', 'angry'],
  },
  proud: {
    name: 'Proud',
    zone: 'green',
    bodySignals: ['tall posture', 'warm chest', 'big smile', 'want to share'],
    visualCues: ['raised head', 'bright eyes', 'open chest', 'big smile'],
    copingStrategies: ['share your accomplishment', 'do a proud pose', 'celebrate with someone'],
    validationPhrases: ['You should be so proud!', 'Look at what you did!', "That's amazing!"],
    complexity: 'intermediate',
    relatedEmotions: ['happy', 'confident', 'excited'],
  },
};

export const ZONE_COLORS: Record<ZoneOfRegulation, { bg: string; text: string; border: string; label: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Blue Zone - Feeling low energy' },
  green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Green Zone - Ready to learn!' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'Yellow Zone - Feeling alert' },
  red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Red Zone - Big feelings' },
};

export function getEmotionsByZone(zone: ZoneOfRegulation): EmotionEntry[] {
  return Object.values(EMOTION_LIBRARY).filter(e => e.zone === zone);
}

export function getEmotionByName(name: string): EmotionEntry | undefined {
  return EMOTION_LIBRARY[name.toLowerCase()];
}
