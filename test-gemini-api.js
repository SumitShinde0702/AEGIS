// Simple test script to verify Gemini API key works
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from 'fs';

// Try to read from .env.local
let apiKey = null;
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  // .env.local not found, try process.env
  apiKey = process.env.GEMINI_API_KEY;
}

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  console.log('💡 Create .env.local file with: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
console.log('🧪 Testing Gemini API connection...\n');

const ai = new GoogleGenAI({ apiKey });

async function testAPI() {
  try {
    console.log('📡 Calling Gemini 3 Pro...');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Say 'API test successful' if you can read this.",
    });

    const text = response.text || '';
    console.log('✅ API Response:', text);
    console.log('\n🎉 SUCCESS! Your Gemini API key is working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Invalid API key');
      console.log('   - API key not set correctly in .env.local');
      console.log('   - Make sure .env.local is in the project root');
    } else if (error.message.includes('quota') || error.message.includes('rate')) {
      console.log('\n💡 Rate limit or quota exceeded');
    } else {
      console.log('\n💡 Check your API key and network connection');
    }
    
    process.exit(1);
  }
}

testAPI();
