import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../context/FamilyContext';
import { getFeed } from '../../services/feed';

/**
 * HomeFeed Page
 * Displays posts for the active family with type, text, and created_at
 */
const HomeFeed = () => {
  const { activeFamilyId } = useFamily();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to family selection if no active family
    if (!activeFamilyId) {
      navigate('/families');
      return;
    }

    // Fetch posts when activeFamilyId changes
    fetchPosts();
  }, [activeFamilyId, navigate]);

  /**
   * Fetch posts from API
   */
  const fetchPosts = async () => {
    if (!activeFamilyId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getFeed({ familyId: activeFamilyId });
      setPosts(data.results || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You are not a member of this family.');
        } else {
          setError(err.response.data?.error || 'Failed to load posts. Please try again.');
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

  if (loading && posts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
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
        <button
          onClick={fetchPosts}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Feed</h1>

      {posts.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: post.type === 'ANNOUNCEMENT' ? '#fff3cd' : '#e7f3ff',
                    borderRadius: '4px',
                  }}
                >
                  {post.type}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0', whiteSpace: 'pre-wrap' }}>{post.text}</p>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
