import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../context/FamilyContext';
import { getFeed } from '../../services/feed';

/**
 * Feed Page
 * Displays posts for the active family
 */
const Feed = () => {
  const { activeFamilyId, activeFamilyName } = useFamily();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to family selection if no active family
    if (!activeFamilyId) {
      navigate('/families');
      return;
    }

    // Fetch posts when activeFamilyId changes
    fetchPosts(activeFamilyId, page);
  }, [activeFamilyId, page, navigate]);

  /**
   * Fetch posts from API
   * @param {number} familyId - The family ID
   * @param {number} pageNum - The page number
   */
  const fetchPosts = async (familyId, pageNum) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFeed({ familyId, page: pageNum });
      setPosts(data.results || []);
      setPagination({
        count: data.count || data.results?.length || 0,
        page: data.page || pageNum,
        pageSize: data.page_size || 10,
        totalPages: data.total_pages || 1,
        hasNext: data.has_next || false,
        hasPrevious: data.has_previous || false,
      });
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
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
          onClick={() => fetchPosts(activeFamilyId, page)}
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
      <h1 style={{ marginBottom: '1rem' }}>
        {activeFamilyName ? `${activeFamilyName} Feed` : 'Feed'}
      </h1>

      {posts.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <>
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
                  <div>
                    <strong>{post.author_user}</strong>
                    {post.author_person_name && (
                      <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                        ({post.author_person_name})
                      </span>
                    )}
                  </div>
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
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    style={{
                      maxWidth: '100%',
                      borderRadius: '4px',
                      marginTop: '0.5rem',
                    }}
                  />
                )}
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

          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '2rem',
              }}
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrevious}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.hasPrevious ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pagination.hasPrevious ? 'pointer' : 'not-allowed',
                }}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasNext}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.hasNext ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Feed;
