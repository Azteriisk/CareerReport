import { clerkSetup } from '@clerk/testing/playwright';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default clerkSetup;
