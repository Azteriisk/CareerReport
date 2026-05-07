"use client";
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    try {
      // Extract username if they pasted a full URL
      let searchVal = query.trim();
      if (searchVal.includes('/u/')) {
        searchVal = searchVal.split('/u/')[1].split('?')[0].split('/')[0];
      }
      
      // Import supabase dynamically to avoid issues if this is rendered early
      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .or(`username.ilike.${searchVal},email.ilike.${searchVal}`)
        .limit(1)
        .single();
        
      if (data?.username) {
        router.push(`/u/${data.username}`);
      } else {
        alert('Could not find a user with that username, email, or link.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form className="mobile-search" onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem 0.5rem 0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: '2.5rem', width: '100%', maxWidth: '600px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }}>
      <Search size={20} color="var(--text-secondary)" style={{ marginRight: '10px' }} />
      <input 
        type="text" 
        placeholder="Find users by username, email, or profile link..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '1rem', color: 'var(--text-primary)' }}
        disabled={isSearching}
      />
      <button type="submit" disabled={isSearching || !query} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, opacity: isSearching ? 0.7 : 1 }}>
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
