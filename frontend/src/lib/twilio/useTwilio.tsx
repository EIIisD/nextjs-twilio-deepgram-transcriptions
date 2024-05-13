import { useState, useEffect, useRef, useCallback } from 'react';
import { Call, Device } from '@twilio/voice-sdk';
import useWebSocketTranscription from '../hooks/useWebsocketTranscripton';

type CallStatus = 'Ready' | 'Ringing' | 'Connected' | 'Error' | 'Idle';

export function useTwilio() {
  const [status, setStatus] = useState<CallStatus>('Idle');
  const deviceRef = useRef<Device | null>(null);
  const [timer, setTimer] = useState(0);
  const callRef = useRef<Call | null>(null);
  const transcriptions = useWebSocketTranscription(
    callRef.current?.parameters.CallSid || null
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTimer = useCallback(() => {
    setTimer((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (status === 'Connected') {
      intervalRef.current = setInterval(updateTimer, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimer(0);
    }
  }, [status, updateTimer]);

  const fetchToken = async (): Promise<string> => {
    const response = await fetch('/api/token');
    const data = await response.json();
    if (!data.token) throw new Error('Token not received from server.');
    return data.token;
  };

  const setupDevice = async () => {
    if (deviceRef.current) return;
    try {
      const token = await fetchToken();
      deviceRef.current = new Device(token, {
        closeProtection: true,
      });
      deviceRef.current.on('ready', () => setStatus('Ready'));
      deviceRef.current.on('connect', () => setStatus('Connected'));
      deviceRef.current.on('disconnect', () => {
        setStatus('Ready');
        setTimer(0);
      });
      deviceRef.current.on('error', (error) => {
        setStatus('Error');
        console.error('Device Error:', error);
      });
      console.log('Device initialized');
    } catch (error) {
      console.error('Error initializing device:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.disconnectAll();
        deviceRef.current.destroy();
      }
    };
  }, []);

  const startCall = async (to: string) => {
    await setupDevice();
    if (!deviceRef.current || !to) {
      setStatus('Error');
      console.error('Device not initialized or no recipient number.');
      return;
    }

    setStatus('Ringing');
    const call = await deviceRef.current.connect({ params: { To: to } });
    callRef.current = call;

    call.on('accept', () => setStatus('Connected'));
    call.on('disconnected', () => setStatus('Ready'));
    call.on('error', (error) => {
      setStatus('Error');
      console.error('Call Error:', error);
    });
  };

  const hangUp = () => {
    if (deviceRef.current) {
      deviceRef.current.disconnectAll();
      setStatus('Ready');
    }
  };

  return {
    status,
    startCall,
    hangUp,
    transcriptions,
    timer: formatTime(timer),
  };
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
};
