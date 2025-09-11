import { connect } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const Connectdb = async () => {
  try {
    await connect(process.env.MONGOURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error; // Re-throw to handle in main.js
  }
};

export { Connectdb };
