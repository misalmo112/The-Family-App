import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../context/FamilyContext';
import { createPost } from '../../services/feed';

/**
 * CreatePost Page
 * Form to create a new post (POST or ANNOUNCEMENT) with optional image URL
 */
const CreatePost = () => {
  const { activeFamilyId } = useFamily();
  const [type, setType] = useState('POST');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to family selection if no active family
    if (!activeFamilyId) {
      navigate('/families');
      return;
    }
  }, [activeFamilyId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeFamilyId) {
      setError('No active family selected.');
      return;
    }

    if (!text.trim()) {
      setError('Text is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createPost({
        familyId: activeFamilyId,
        type,
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      // Navigate to feed on success
      navigate('/feed');
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You are not a member of this family.');
        } else {
          const errorData = err.response.data;
          if (typeof errorData === 'object' && errorData !== null) {
            // Handle field-specific errors
            const errorMessages = Object.entries(errorData)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                }
                return `${key}: ${value}`;
              })
              .join('; ');
            setError(errorMessages || 'Failed to create post. Please try again.');
          } else {
            setError(errorData?.error || 'Failed to create post. Please try again.');
          }
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!activeFamilyId) {
    return null; // Will redirect via useEffect
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Create Post</h1>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="type"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            Type <span style={{ color: '#c00' }}>*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
          >
            <option value="POST">POST</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="text"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            Text <span style={{ color: '#c00' }}>*</span>
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            required
            rows={6}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="imageUrl"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            Image URL (optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
            placeholder="https://example.com/image.jpg"
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/feed')}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
