import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';
import { useFamily } from '../context/FamilyContext';
import { getFeed } from '../services/feed';
import { SkeletonPostList } from '../components/Loading/SkeletonPost';
import PageTransition from '../components/PageTransition';
import PostComments from '../components/PostComments';

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
 * PostCard Component
 * Renders POST type as long-form card with optional family label
 */
const PostCard = ({ post, showFamilyLabel = false }) => {
  const authorName = post.author_person_name || post.author_user;
  const initials = getInitials(authorName);

  return (
    <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
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
              icon={<ArticleIcon />}
              label="POST"
              size="small"
              color="primary"
              variant="outlined"
            />
            {showFamilyLabel && post.family_name && (
              <Chip
                label={post.family_name}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        }
        subheader={formatRelativeTime(post.created_at)}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: post.image_url ? 2 : 0, fontSize: '1rem' }}>
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
        <PostComments postId={post.id} postType={post.type} />
      </CardContent>
    </Card>
  );
};

/**
 * PersonProfile Page
 * Displays posts for a specific person
 */
const PersonProfile = () => {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { activeFamilyId, activeFamilyName } = useFamily();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showAllFamilies, setShowAllFamilies] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [checkingAuthor, setCheckingAuthor] = useState(true);
  const observerTarget = useRef(null);

  // Check if viewer is the author on mount
  useEffect(() => {
    const checkAuthorStatus = async () => {
      if (!personId) {
        setCheckingAuthor(false);
        return;
      }

      try {
        // Try to fetch with scope=all_families to check if user is author
        // Note: familyId should not be passed when scope=all_families
        await getFeed({
          authorPersonId: parseInt(personId),
          type: 'POST',
          scope: 'all_families',
          page: 1,
        });
        // If successful, user is the author
        setIsAuthor(true);
      } catch (err) {
        // If 403, user is not the author
        if (err.response?.status === 403) {
          setIsAuthor(false);
        } else {
          // For other errors, assume not author (will be handled by main fetch)
          setIsAuthor(false);
        }
      } finally {
        setCheckingAuthor(false);
      }
    };

    checkAuthorStatus();
  }, [personId]);

  // Fetch posts when parameters change
  useEffect(() => {
    if (!personId || checkingAuthor) {
      return;
    }

    // If not showing all families, we need activeFamilyId
    if (!showAllFamilies && !activeFamilyId) {
      return;
    }

    // Reset posts and page when parameters change
    setPosts([]);
    setPage(1);
    fetchPosts(activeFamilyId, parseInt(personId), 1, true);
  }, [activeFamilyId, personId, showAllFamilies, checkingAuthor]);

  /**
   * Fetch posts from API
   */
  const fetchPosts = async (familyId, authorPersonId, pageNum, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = {
        authorPersonId,
        type: 'POST',
        page: pageNum,
      };

      if (showAllFamilies) {
        params.scope = 'all_families';
      } else {
        params.familyId = familyId;
      }

      const data = await getFeed(params);
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
          setError('You are not a member of this family or do not have permission to view this profile.');
        } else if (err.response.status === 404) {
          setError('Person not found.');
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
          fetchPosts(activeFamilyId, parseInt(personId), nextPage, false);
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
  }, [pagination, loadingMore, loading, page, activeFamilyId, personId, showAllFamilies]);

  // Redirect to family selection if no active family (unless showing all families)
  useEffect(() => {
    if (!activeFamilyId && !checkingAuthor && !showAllFamilies) {
      navigate('/app/families');
    }
  }, [activeFamilyId, navigate, checkingAuthor, showAllFamilies]);

  if (checkingAuthor || (!activeFamilyId && !checkingAuthor && !showAllFamilies)) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <SkeletonPostList count={3} />
      </Container>
    );
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
      <PageTransition>
        <Container maxWidth="md">
          <Box sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
            <Button variant="contained" onClick={() => fetchPosts(activeFamilyId, parseInt(personId), page, true)}>
              Retry
            </Button>
          </Box>
        </Container>
      </PageTransition>
    );
  }

  // Get person name from first post if available
  const personName = posts.length > 0 
    ? (posts[0].author_person_name || posts[0].author_user)
    : 'Person';

  return (
    <PageTransition>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1">
            {personName}'s Posts
          </Typography>
          {isAuthor && (
            <FormControlLabel
              control={
                <Switch
                  checked={showAllFamilies}
                  onChange={(e) => setShowAllFamilies(e.target.checked)}
                  color="primary"
                />
              }
              label="All Families"
            />
          )}
        </Box>

        {posts.length === 0 ? (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box textAlign="center" py={4}>
                <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showAllFamilies 
                    ? 'This person has not posted anything across any family.'
                    : 'This person has not posted anything in this family.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={3}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showFamilyLabel={showAllFamilies} />
            ))}
          </Stack>
        )}

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
              You've reached the end of the posts
            </Typography>
          </Box>
        )}
      </Container>
    </PageTransition>
  );
};

export default PersonProfile;
