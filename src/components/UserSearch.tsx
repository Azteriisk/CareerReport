"use client";
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    // Extract username if they pasted a full URL
    let username = query.trim();
    if (username.includes('/u/')) {
      username = username.split('/u/')[1];
    }
    
    // Clean up any trailing slashes or query parameters
    username = username.split('?')[0].split('/')[0];
    
    // Mock mapping phone numbers or emails to a username
    if (username.includes('@') || username.match(/^[0-9\-\+\s\(\)]+$/)) {
      username = 'janedoe'; // fallback for demo mock lookup
    }

    router.push(`/u/${username}`);
  };

  return (
    <form className="mobile-search" onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem 0.5rem 0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: '2.5rem', width: '100%', maxWidth: '600px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }}>
      <Search size={20} color="var(--text-secondary)" style={{ marginRight: '10px' }} />
      <input 
        type="text" 
        placeholder="Find users by username, email, phone, or link..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '1rem', color: 'var(--text-primary)' }}
      />
      <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
        Search
      </button>
    </form>
  );
}
