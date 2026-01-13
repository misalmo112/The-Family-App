import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useFamily } from '../../context/FamilyContext';
import { getFeed } from '../../services/feed';
import { SkeletonPostList } from '../../components/Loading/SkeletonPost';
import PageTransition from '../../components/PageTransition';

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString();
};

/**
 * Get initials from name
 */
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Feed Page
 * Displays posts for the active family
 */
const Feed = () => {
  const { activeFamilyId, activeFamilyName } = useFamily();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();
  const observerTarget = useRef(null);

  useEffect(() => {
    // Redirect to family selection if no active family
    if (!activeFamilyId) {
      navigate('/families');
      return;
    }

    // Reset posts and page when family changes
    setPosts([]);
    setPage(1);
    fetchPosts(activeFamilyId, 1, true);
  }, [activeFamilyId, navigate]);

  /**
   * Fetch posts from API
   * @param {number} familyId - The family ID
   * @param {number} pageNum - The page number
   * @param {boolean} reset - Whether to reset posts or append
   */
  const fetchPosts = async (familyId, pageNum, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const data = await getFeed({ familyId, page: pageNum });
      const newPosts = data.results || [];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      }
      
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
      setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasNext && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(activeFamilyId, nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [pagination, loadingMore, loading, page, activeFamilyId]);

  if (!activeFamilyId) {
    return null; // Will redirect via useEffect
  }

  if (loading && posts.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <SkeletonPostList count={3} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => fetchPosts(activeFamilyId, page)}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <PageTransition>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          {activeFamilyName ? `${activeFamilyName} Feed` : 'Feed'}
        </Typography>

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Be the first to share something with your family!
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/post')}
                startIcon={<ArticleIcon />}
              >
                Create Post
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Stack spacing={3}>
            {posts.map((post) => {
              const authorName = post.author_person_name || post.author_user;
              const initials = getInitials(authorName);
              const isAnnouncement = post.type === 'ANNOUNCEMENT';

              return (
                <Card key={post.id} sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: isAnnouncement ? 'warning.main' : 'primary.main' }}>
                        {initials}
                      </Avatar>
                    }
                    title={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="subtitle1" component="span">
                          {post.author_user}
                        </Typography>
                        {post.author_person_name && (
                          <Typography variant="body2" color="text.secondary" component="span">
                            ({post.author_person_name})
                          </Typography>
                        )}
                        <Chip
                          icon={isAnnouncement ? <AnnouncementIcon /> : <ArticleIcon />}
                          label={post.type}
                          size="small"
                          color={isAnnouncement ? 'warning' : 'primary'}
                          variant={isAnnouncement ? 'filled' : 'outlined'}
                        />
                      </Box>
                    }
                    subheader={formatRelativeTime(post.created_at)}
                  />
                  <Divider />
                  <CardContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: post.image_url ? 2 : 0 }}>
                      {post.text}
                    </Typography>
                    {post.image_url && (
                      <Box
                        component="img"
                        src={post.image_url}
                        alt="Post"
                        sx={{
                          width: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          borderRadius: 2,
                          mt: 2,
                          cursor: 'pointer',
                        }}
                        onClick={() => window.open(post.image_url, '_blank')}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {/* Infinite scroll trigger */}
          {pagination?.hasNext && (
            <Box ref={observerTarget} sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              {loadingMore && <CircularProgress />}
            </Box>
          )}
          
          {/* End of feed message */}
          {!pagination?.hasNext && posts.length > 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                You've reached the end of the feed
              </Typography>
            </Box>
          )}
        </>
      )}
      </Container>
    </PageTransition>
  );
};

export default Feed;
