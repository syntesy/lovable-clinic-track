
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode base64 safely handling large strings
function decodeBase64(base64String: string): Uint8Array {
  // Use atob to decode the entire base64 string at once
  // This is safe because atob handles the decoding correctly
  const binaryString = atob(base64String);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      console.error('No audio data provided');
      return new Response(
        JSON.stringify({ error: 'No audio data provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing audio transcription...');
    console.log('MIME type:', mimeType);
    console.log('Base64 length:', audio.length);

    // Decode base64 to binary
    const binaryAudio = decodeBase64(audio);
    console.log('Audio size:', binaryAudio.length, 'bytes');
    console.log('Audio size (MB):', (binaryAudio.length / (1024 * 1024)).toFixed(2));

    // Validate audio size (OpenAI Whisper limit is 25MB)
    const maxSizeMB = 25;
    if (binaryAudio.length > maxSizeMB * 1024 * 1024) {
      console.error('Audio file too large:', binaryAudio.length);
      return new Response(
        JSON.stringify({ error: `Arquivo de áudio muito grande. Máximo: ${maxSizeMB}MB` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determine file extension from mime type
    let extension = 'webm';
    if (mimeType) {
      if (mimeType.includes('webm')) extension = 'webm';
      else if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) extension = 'mp3';
      else if (mimeType.includes('wav')) extension = 'wav';
      else if (mimeType.includes('ogg')) extension = 'ogg';
    }

    console.log('Using file extension:', extension);

    // Create a new ArrayBuffer to satisfy TypeScript types
    const newBuffer = new ArrayBuffer(binaryAudio.length);
    const newView = new Uint8Array(newBuffer);
    newView.set(binaryAudio);
    
    // Create blob from ArrayBuffer
    const blob = new Blob([newBuffer], { type: mimeType || 'audio/webm' });
    
    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Portuguese
    formData.append('response_format', 'text');

    console.log('Sending to OpenAI Whisper API...');

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      // Parse error for better messages
      let userMessage = 'Erro ao transcrever áudio';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          userMessage = errorJson.error.message;
        }
      } catch {
        userMessage = errorText || 'Erro desconhecido da API';
      }
      
      return new Response(
        JSON.stringify({ error: userMessage }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const text = await response.text();
    console.log('Transcription completed successfully');
    console.log('Transcription length:', text.length, 'characters');

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
