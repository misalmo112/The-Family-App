import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Button,
} from '@mui/material';
import { useFamily } from '../../context/FamilyContext';
import { getFeed } from '../../services/feed';

/**
 * HomeFeed Page
 * Displays posts for the active family with type, text, and created_at
 */
const HomeFeed = () => {
  const { activeFamilyId, activeFamilyName } = useFamily();
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
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Loading feed...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchPosts}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {activeFamilyName ? `${activeFamilyName} Feed` : 'Feed'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Messages, posts, and announcements appear in one timeline.
        </Typography>
      </Box>

      {posts.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No posts yet. Be the first to post!
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Chip
                    label={post.type}
                    color={post.type === 'ANNOUNCEMENT' ? 'secondary' : 'primary'}
                    variant={post.type === 'ANNOUNCEMENT' ? 'outlined' : 'filled'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(post.created_at).toLocaleString()}
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {post.text}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default HomeFeed;
