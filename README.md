This is a starter template using Next.js and Fastify for getting started with [Deepgram](https://deepgram.com/) and [Twilio](https://www.twilio.com/en-us) for live phone call transcription. Deepgram provides a faster, cheaper, and more accurate transcription than common alternatives like Google Speech-to-Text or OpenAI Whisper. With Twilio, we can set up a flow that will stream the audio from a phone call to Deepgram, and then stream the transcription back to the frontend in real-time.

Because Next.js is designed for serverless hosting, we use a monorepo with a Fastify server to handle the Twilio webhook. This allows us to keep the frontend and backend in the same repository, while still being able to deploy the frontend to Vercel and the backend to Heroku, AWS, or another provider. This template will be updated to include instructions for deploying to Digital Ocean.

All PRs and suggestions are welcome.

## Getting Started

** Coming Soon **

## Features

- [x] Next.js frontend
- [x] Fastify backend
- [x] Twilio webhook
- [x] Deepgram integration
- [x] Real-time transcription
- [ ] Monorepo Config 
- [ ] Docker Config
- [ ] Deployment Instructions
