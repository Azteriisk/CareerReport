import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return new Response('Missing username parameter', { status: 400 });
    }

    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username, bio')
      .eq('username', username)
      .single();

    if (profileErr || !profile) {
      return new Response('Profile not found', { status: 404 });
    }

    // 2. Fetch the latest public resume basic info
    const { data: resume } = await supabase
      .from('resumes')
      .select('data')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const displayName = profile.full_name || `@${profile.username}`;
    const jobTitle = resume?.data?.basics?.label || 'Professional Networker';
    const summary = resume?.data?.basics?.summary || profile.bio || 'Check out my professional profile and resume on CareerReport.';

    // Safe Dicebear fallback for dynamic cards
    const avatarSrc = profile.avatar_url || `https://api.dicebear.com/7.x/initials/png?seed=${username}&backgroundColor=064e3b`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#040b0e',
            backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(4, 120, 87, 0.18) 0%, transparent 45%)',
            padding: '40px',
          }}
        >
          {/* Virtual Business Card Layout */}
          <div
            style={{
              width: '1080px',
              height: '550px',
              display: 'flex',
              background: 'rgba(11, 19, 26, 0.85)',
              borderRadius: '24px',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              padding: '45px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
              overflow: 'hidden',
            }}
          >
            {/* Glowing Accent strip on left border */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '8px',
                background: 'linear-gradient(180deg, #10b981, #059669)',
              }}
            />

            {/* Left Content Side */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingRight: '35px',
              }}
            >
              {/* User Bio Header Section */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
                <div
                  style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '65px',
                    border: '3px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: '#064e3b',
                    marginRight: '28px',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontSize: '46px',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginBottom: '6px',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#10b981',
                      fontWeight: 600,
                      letterSpacing: '0.25px',
                    }}
                  >
                    @{profile.username}
                  </div>
                </div>
              </div>

              {/* Position Title / Label */}
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  marginBottom: '16px',
                }}
              >
                {jobTitle}
              </div>

              {/* Bio Summary Pitch */}
              <div
                style={{
                  fontSize: '19px',
                  lineHeight: 1.5,
                  color: '#94a3b8',
                  maxHeight: '145px',
                  overflow: 'hidden',
                }}
              >
                {summary.length > 200 ? summary.substring(0, 200) + '...' : summary}
              </div>
            </div>

            {/* Right Branded Partition */}
            <div
              style={{
                width: '320px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                paddingLeft: '35px',
              }}
            >
              {/* Top: Site Identity Brand Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    CareerReport
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginTop: '4px',
                    fontWeight: 600,
                  }}
                >
                  Your Professional Network
                </div>
              </div>

              {/* Bottom: Verified Badge & Context */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    fontSize: '16px',
                    color: '#10b981',
                    fontWeight: 700,
                    marginBottom: '6px',
                    letterSpacing: '1px',
                  }}
                >
                  VERIFIED PROFILE
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#475569',
                    textAlign: 'right',
                    lineHeight: 1.4,
                  }}
                >
                  Connect and review verified credentials on the next-gen network.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    console.error('Error in profile OG route:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
