import * as dotenv from 'dotenv';
import * as fs from 'fs';
import WebSocket from 'ws';
import {
  createClient,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
} from '@deepgram/sdk';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

// Base interface for all messages
interface BaseMessage {
  event: string;
  sequenceNumber: string;
  streamSid: string;
}

// Interface for the 'start' event
interface StartMessage extends BaseMessage {
  start: {
    accountSid: string;
    streamSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
    customParameters: {
      FirstName: string;
    };
  };
}

dotenv.config();

const fastify = Fastify({
  logger: true,
});
fastify.register(fastifyWebsocket);

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
  throw new Error('DEEPGRAM_API_KEY environment variable not found');
}

const subscribers = new Map<string, WebSocket[]>();

let isConnectionReady = false;

fastify.register(async function (fastify) {
  fastify.get('/twilio', { websocket: true }, (ws, req) => {
    // Extract the request path to determine the connection type
    const path = req.url;
    console.log(`New connection on ${path}`);
    // Handle connections on the /twilio path
    let callSid: string | undefined;

    const deepgram = createClient(deepgramApiKey);
    // Start a new live transcription connection with Deepgram
    const connection = deepgram.listen.live({
      model: 'nova-2',
      smart_format: true,
      encoding: 'mulaw',
      sample_rate: 8000,
      channels: 1,
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection open');
      isConnectionReady = true;
    });

    connection.on(LiveTranscriptionEvents.Close, (closeEvent) => {
      console.log('Deepgram connection closed:', closeEvent);
      isConnectionReady = false;
      // Check for specific close codes and payloads
      console.log('close event code:', closeEvent);
      if (closeEvent.code === 1008) {
        console.error(
          'Deepgram connection closed due to unsupported audio format (DATA-0000)'
        );
      } else if (closeEvent.code === 1011) {
        if (closeEvent.reason === 'NET-0000') {
          console.error('Deepgram connection closed due to timeout (NET-0000)');
        } else if (closeEvent.reason === 'NET-0001') {
          console.error(
            'Deepgram connection closed due to no data received (NET-0001)'
          );
        }
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Error from Deepgram:', error);
      isConnectionReady = false;

      // Log the error details and request ID for debugging
      console.error('Request ID:', error.requestId);
      console.error('Error details:', error.details);
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection open');
      isConnectionReady = true;
    });
    // Handle 'media' event messages
    const mixedAudioStream = fs.createWriteStream('mixedAudio.raw');

    ws.on('message', (data) => {
      const twilioMessage = JSON.parse(data.toString());
      if (twilioMessage['event'].includes('start')) {
        console.log('START MESSAGE');
        callSid = (twilioMessage as StartMessage).start.callSid;

        connection.on(
          LiveTranscriptionEvents.Transcript,
          (transcript: LiveTranscriptionEvent) => {
            if (!callSid) {
              console.log('no callSid in transcript');
              return;
            }
            const subscriberSockets = subscribers.get(callSid);
            if (!subscriberSockets) {
              console.log('no subscribers');
              return;
            }
            console.log('full transcript:', transcript);
            if (transcript.channel.alternatives[0].transcript.length > 0) {
              console.log(
                'Transcript:',
                transcript.channel.alternatives[0].transcript
              );
            }

            subscriberSockets.forEach((subscriberSocket) => {
              subscriberSocket.send(
                JSON.stringify({ type: 'transcription', data: transcript })
              );
            });
          }
        );
      }
      if (twilioMessage['event'] === 'media') {
        const media = twilioMessage['media'];
        const audio = Buffer.from(media['payload'], 'base64');

        if (isConnectionReady) {
          connection.send(Buffer.from(audio));
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      mixedAudioStream.end();
      connection.removeAllListeners();
      if (connection) {
        connection.finish();
      }
    });
  });

  fastify.get('/client', { websocket: true }, (connection) => {
    console.log('new client connected');

    connection.on('message', (message) => {
      // The message is expected to be the callSid
      const callSid = message.toString();
      console.log('call sid is', callSid);
      if (!callSid) {
        console.log('no callSid');
        return;
      }
      // Add the WebSocket connection as a subscriber for the given callSid
      if (!subscribers.has(callSid)) {
        subscribers.set(callSid, []);
      }
      subscribers.get(callSid)?.push(connection);
      console.log('new subscriber', callSid);
      // Remove the WebSocket connection from subscribers on close
      connection.on('close', () => {
        const subscriberSockets = subscribers.get(callSid) || [];

        const index = subscriberSockets.indexOf(connection);
        if (index !== -1) {
          subscriberSockets.splice(index, 1);
        }
      });
    });
  });
});

// Listen on port 8080
const start = async () => {
  try {
    await fastify.listen({ port: 8080 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
