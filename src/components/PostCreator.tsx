"use client";
import React, { useState, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { useUser, useAuth } from '@clerk/nextjs';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';

export function PostCreator({ onPostCreated }: { onPostCreated?: () => void }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MAX_CHARS = 500;
  const charsRemaining = MAX_CHARS - content.length;
  
  if (!isLoaded || !isSignedIn) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    if (content.length > MAX_CHARS) return;
    
    setIsSubmitting(true);
    
    try {
      // Attach the Clerk JWT so Supabase RLS can verify the user
      const token = await getToken({ template: 'supabase' });
      
      
      let image_url = null;
      
      // Upload image if present
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `public/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert('Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      // Create post
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          content: content.trim(),
          image_url
        }]);

      if (error) {
        console.error('Failed to create post — Supabase error:', error.message, error.code, error.details);
        alert(`Failed to post: ${error.message}`);
        return;
      }
      
      // Reset form
      setContent('');
      clearImage();
      if (onPostCreated) onPostCreated();
      
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('An error occurred while posting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      background: 'var(--surface-color)', 
      borderRadius: '16px', 
      padding: '1.25rem', 
      marginBottom: '1.5rem',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <form onSubmit={handleSubmit}>
        <textarea 
          placeholder="What's on your mind? Share an update or ask a question..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
          disabled={isSubmitting}
          style={{ 
            width: '100%', 
            minHeight: '100px', 
            background: 'transparent', 
            border: 'none', 
            resize: 'none', 
            color: 'var(--text-primary)', 
            fontSize: '1rem',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            marginBottom: '0.5rem'
          }}
        />
        
        {imagePreview && (
          <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden' }}>
            <button 
              type="button"
              onClick={clearImage}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={18} />
            </button>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon" 
              style={{ color: 'var(--primary)' }}
              disabled={isSubmitting}
              title="Add Image"
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: charsRemaining < 20 ? 'var(--error)' : 'var(--text-secondary)' }}>
              {charsRemaining}
            </span>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || (!content.trim() && !imageFile) || charsRemaining < 0}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
