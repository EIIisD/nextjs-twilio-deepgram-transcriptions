'use client';

import { LiveTranscriptionEvent } from '@deepgram/sdk';
import { useEffect, useState } from 'react';

interface WebsocketMessage {
  type: 'transcription';
  data: LiveTranscriptionEvent;
}

const useWebSocketTranscription = (callSid: string | null) => {
  const [transcriptions, setTranscriptions] = useState<string | undefined>('');
  const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
  useEffect(() => {
    if (!callSid) return;
    console.log('callSid in socket', callSid);
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (error: any) {
      console.error('Error creating WebSocket connection:', error);
      throw new Error('Error opening WebSocket connection:', error);
    }

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let transcript = data.channel.alternatives[0].transcript;

      console.log('thisCaption', transcript);
      if (transcript.length > 0 && speechFinal && isFinal) {
        console.log('thisCaption !== ""', transcript);
        setTranscriptions((prev) =>
          prev ? prev.concat('\n' + transcript) : transcript
        );
      }
    };

    ws.onopen = function open() {
      console.log('WebSocket connection established.');
      ws.send(callSid);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebsocketMessage = JSON.parse(event.data);
        console.log('message', message);
        if (message.type === 'transcription') {
          onTranscript(message.data);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [callSid, url]);

  return transcriptions;
};

export default useWebSocketTranscription;
