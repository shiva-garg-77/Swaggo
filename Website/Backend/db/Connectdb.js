import { connect } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const Connectdb=()=> connect(process.env.MONGOURI)
.then(() => {
console.log('Connected to MongoDB');
}).
catch((error) => {
console.error('Error connecting to MongoDB:', error);
});

export {Connectdb }