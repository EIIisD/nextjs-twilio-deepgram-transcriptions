const sid = process.env.TWILIO_API_SID ?? '';
const sec = process.env.TWILIO_API_SECRET ?? '';
const accSid = process.env.TWILIO_ACC_SID ?? '';
const twiml = process.env.TWILIO_TWIML_SID ?? '';

const checkEnvVars = () => {
  switch (true) {
    case !sid:
      throw new Error('TWILIO_API_SID is not set');
    case !sec:
      throw new Error('TWILIO_API_SECRET is not set');
    case !accSid:
      throw new Error('TWILIO_ACC_SID is not set');
    case !twiml:
      throw new Error('TWILIO_TWIML_SID is not set');
    default:
      return {
        sid,
        sec,
        accSid,
        twiml,
      };
  }
};

export { checkEnvVars };
