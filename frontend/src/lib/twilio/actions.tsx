'use server';

const fetchToken = async (): Promise<string> => {
  const response = await fetch('/api/voice', {
    method: 'GET',
    cache: 'no-store',
  });
  const data = await response.json();
  if (!data.token) throw new Error('Token not received from server.');
  return data.token;
};
