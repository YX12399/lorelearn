import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No key' }, { status: 500 });
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Try listing models via the REST API directly
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`
    );
    const data = await resp.json();
    
    if (data.error) return NextResponse.json({ error: data.error });
    
    const allModels = (data.models || []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
      name: m.name,
      methods: m.supportedGenerationMethods || [],
    }));
    
    const videoModels = allModels.filter((m: { name: string }) => 
      m.name.toLowerCase().includes('veo') || 
      m.name.toLowerCase().includes('video')
    );
    
    return NextResponse.json({ 
      totalModels: allModels.length,
      videoModels,
      allNames: allModels.map((m: { name: string }) => m.name).sort()
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
