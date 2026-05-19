import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, email, issueType, description, userId } = await request.json();

    if (!name || !email || !issueType || !description) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Insert the ticket into the Supabase support_tickets table
    const { data, error } = await supabase
      .from('support_tickets' as any)
      .insert([
        {
          name,
          email,
          issue_type: issueType,
          description,
          user_id: userId || null,
          status: 'open',
        },
      ])
      .select();

    if (error) {
      console.error('Database insertion error:', error);
      
      // Fallback: If the support_tickets table does not exist yet in the database,
      // log the ticket details clearly in the server logs so that the support submission is NOT lost.
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation "public.support_tickets" does not exist')) {
        console.warn('CRITICAL WARNING: The "support_tickets" table does not exist in the database. Ticket details logged below:');
        console.warn(JSON.stringify({ name, email, issueType, description, userId, timestamp: new Date().toISOString() }, null, 2));
        
        // Return a successful response but mark it as fallback-logged
        return NextResponse.json({ 
          success: true, 
          fallback: true,
          message: 'Support ticket received via server fallback logger.' 
        });
      }
      
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Support Ticket Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
