import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Link as MuiLink,
} from '@mui/material';
import { Send as SendIcon, Comment as CommentIcon } from '@mui/icons-material';
import { getComments, createComment } from '../services/feed';

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
 * PostComments Component
 * Displays comments for a post with lazy loading and comment creation
 */
const PostComments = ({ postId, postType }) => {
  // Validate post type - only show comments for POST and ANNOUNCEMENT
  if (postType !== 'POST' && postType !== 'ANNOUNCEMENT') {
    return null;
  }

  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Fetch comments when expanded (only once)
  useEffect(() => {
    if (expanded && !loading && commentCount === null) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  /**
   * Fetch comments for the post
   */
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getComments(postId, 1);
      const fetchedComments = data.results || [];
      
      setComments(fetchedComments);
      setCommentCount(data.count || fetchedComments.length);
      setPagination({
        count: data.count || fetchedComments.length,
        page: data.page || 1,
        pageSize: data.page_size || 10,
        totalPages: data.total_pages || 1,
        hasNext: data.has_next || false,
        hasPrevious: data.has_previous || false,
      });
    } catch (err) {
      console.error('Error fetching comments:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You are not authorized to view comments.');
        } else {
          setError(err.response.data?.error || 'Failed to load comments. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle comment submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const newComment = await createComment(postId, commentText.trim());

      // Optimistic update: add new comment to the list
      setComments((prevComments) => [newComment, ...prevComments]);
      setCommentCount((prevCount) => (prevCount !== null ? prevCount + 1 : 1));

      // Clear input
      setCommentText('');
    } catch (err) {
      console.error('Error creating comment:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You are not authorized to comment on this post.');
        } else {
          const errorData = err.response.data;
          if (typeof errorData === 'object' && errorData !== null) {
            const errorMessages = Object.entries(errorData)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
                }
                return `${key}: ${value}`;
              })
              .join('; ');
            setError(errorMessages || 'Failed to create comment. Please try again.');
          } else {
            setError(errorData?.error || 'Failed to create comment. Please try again.');
          }
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle expanded state
   */
  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      
      {/* Expand/Collapse Button */}
      <Button
        startIcon={<CommentIcon />}
        onClick={handleToggleExpanded}
        size="small"
        sx={{ mb: expanded ? 2 : 0 }}
      >
        {expanded ? 'Hide Comments' : `${commentCount !== null ? commentCount : 'View'} Comment${commentCount !== 1 ? 's' : ''}`}
      </Button>

      {/* Comments Section */}
      {expanded && (
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {/* Comments List */}
              {comments.length > 0 ? (
                <Stack spacing={2} sx={{ mb: 2 }}>
                  {comments.map((comment) => {
                    const authorName = comment.author_person_name || comment.author_user;
                    const initials = getInitials(authorName);

                    return (
                      <Box
                        key={comment.id}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          alignItems: 'flex-start',
                          pl: 1,
                        }}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {initials}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            {comment.author_person_id ? (
                              <MuiLink
                                component={Link}
                                to={`/people/${comment.author_person_id}`}
                                color="inherit"
                                sx={{
                                  '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline',
                                  },
                                }}
                              >
                                {authorName}
                              </MuiLink>
                            ) : (
                              authorName
                            )}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {comment.text}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {formatRelativeTime(comment.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  No comments yet. Be the first to comment!
                </Typography>
              )}

              {/* Comment Input Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <Box display="flex" gap={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={submitting}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={!commentText.trim() || submitting}
                    sx={{ mb: 0.5 }}
                  >
                    {submitting ? <CircularProgress size={20} /> : <SendIcon />}
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PostComments;
