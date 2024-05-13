import { NextRequest } from 'next/server';
import AccessToken, { VoiceGrant } from 'twilio/lib/jwt/AccessToken';
import { checkEnvVars } from './utils';

// Opt out of caching for all data requests in the route segment
export const dynamic = 'force-dynamic';

const { sid, sec, accSid, twiml } = checkEnvVars();

export async function GET(request: NextRequest) {
  console.log('getting token!');

  try {
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twiml,
    });

    const identity = 'user';
    console.log('sid', sid);

    const token = new AccessToken(accSid, sid, sec, {
      identity: identity,
    });

    token.addGrant(voiceGrant);
    console.log('sending back token');

    return Response.json({ token: token.toJwt() });
  } catch (error) {
    console.error('Error getting token:', error);
    return Response.json({ error: error }, { status: 500 });
  }
}
