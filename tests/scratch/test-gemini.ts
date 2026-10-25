import 'dotenv/config';
import { GoogleAuth } from 'google-auth-library';
import * as path from 'path';

async function main() {
  console.log('Testing connection to Vertex AI via google-auth-library and direct fetch...');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0208330266';
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve('credentials.json');

  try {
    // Load credentials and request cloud-platform scope
    const auth = new GoogleAuth({
      keyFile: credPath,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    
    console.log('Getting access token...');
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;
    
    if (!accessToken) {
      throw new Error('Failed to retrieve access token.');
    }
    
    console.log('Access token retrieved successfully!');
    
    // Direct endpoint call
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash:generateContent`;
    
    console.log('Sending request to Vertex AI...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello, respond with OK if you hear me.' }] }]
      })
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log('AI Response:', data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
      console.log('✅ Direct Vertex AI authentication successful!');
    } else {
      console.error('❌ Vertex AI call failed:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Connection failed:');
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
