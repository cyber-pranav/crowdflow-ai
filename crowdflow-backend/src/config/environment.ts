import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'crowdflow-demo',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  simulation: {
    userCount: parseInt(process.env.SIMULATION_USER_COUNT || '500', 10),
    tickInterval: parseInt(process.env.SIMULATION_TICK_INTERVAL_MS || '2000', 10),
  },
};

export const isProduction = config.nodeEnv === 'production';
export const hasFirebase = !!config.firebase.clientEmail;
export const hasGemini = !!config.gemini.apiKey;
