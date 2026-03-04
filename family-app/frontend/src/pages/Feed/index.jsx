import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
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
  TextField,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Link as MuiLink,
  Tooltip,
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Article as ArticleIcon,
  Message as MessageIcon,
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Chat as ChatIcon,
  Mic as MicIcon,
  PhotoCamera as PhotoCameraIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { getFeed, createPost } from '../../services/feed';
import { getProfile } from '../../services/auth';
import { getCurrentUserPersonId } from '../../services/graph';
import { SkeletonPostList } from '../../components/Loading/SkeletonPost';
import PageTransition from '../../components/PageTransition';
import PostComments from '../../components/PostComments';

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
 * MessageBubble Component
 * Renders MESSAGE type as short chat bubble
 */
const MessageBubble = ({ post, currentUsername }) => {
  const authorName = post.author_person_name || post.author_user;
  const initials = getInitials(authorName);
  // Determine if current user by comparing author_user with currentUsername
  const isCurrentUser = currentUsername && post.author_user === currentUsername;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        mb: 1.5,
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
      }}
    >
      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
        {initials}
      </Avatar>
      <Box 
        sx={{ 
          maxWidth: '70%', 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        }}
      >
        {!isCurrentUser && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, px: 1, alignSelf: 'flex-start' }}>
            {post.author_person_id ? (
              <MuiLink
                component={Link}
                to={`/people/${post.author_person_id}`}
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {authorName}
              </MuiLink>
            ) : (
              authorName
            )}
          </Typography>
        )}
        <Paper
          elevation={0}
          sx={{
            bgcolor: isCurrentUser
              ? 'primary.main'
              : (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
            color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
            p: 1.5,
            borderRadius: 2,
            borderTopLeftRadius: isCurrentUser ? 2 : 0,
            borderTopRightRadius: isCurrentUser ? 0 : 2,
            display: 'inline-block',
            maxWidth: '100%',
            wordBreak: 'break-word',
            flexShrink: 0, // Prevent compression
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: 1,
            },
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: (post.voice_message_url || post.file_attachment_url) ? 1.5 : 0 }}>
            {post.text}
          </Typography>
          
          {/* Voice Message Player */}
          {post.voice_message_url && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlayArrowIcon sx={{ fontSize: 20 }} />
              <Box component="audio" controls src={post.voice_message_url} sx={{ flex: 1, maxWidth: '250px' }} />
            </Box>
          )}
          
          {/* File Attachment */}
          {post.file_attachment_url && (
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: isCurrentUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <InsertDriveFileIcon sx={{ fontSize: 20 }} />
              <Button
                component="a"
                href={post.file_attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  color: 'inherit',
                  textTransform: 'none',
                  minWidth: 'auto',
                  p: 0.5,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <Typography variant="caption">
                  {post.file_attachment_url.split('/').pop() || 'Download file'}
                </Typography>
              </Button>
            </Box>
          )}
        </Paper>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.5,
            px: 1,
            alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
          }}
        >
          {formatRelativeTime(post.created_at)}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * PostCard Component
 * Renders POST type as long-form card
 */
const PostCard = ({ post }) => {
  const authorName = post.author_person_name || post.author_user;
  const initials = getInitials(authorName);

  return (
    <Card
      sx={{
        mb: 2,
        flexShrink: 0, // Prevent compression
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {initials}
          </Avatar>
        }
        title={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {post.author_person_id ? (
              <MuiLink
                component={Link}
                to={`/people/${post.author_person_id}`}
                color="inherit"
                sx={{
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                }}
              >
                <Typography variant="subtitle1" component="span">
                  {post.author_user}
                </Typography>
              </MuiLink>
            ) : (
              <Typography variant="subtitle1" component="span">
                {post.author_user}
              </Typography>
            )}
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
          </Box>
        }
        subheader={formatRelativeTime(post.created_at)}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: (post.photo_url || post.image_url) ? 2 : 0, fontSize: '1rem' }}>
          {post.text}
        </Typography>
        {(post.photo_url || post.image_url) && (
          <Box
            component="img"
            src={post.photo_url || post.image_url}
            alt="Post"
            sx={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
              borderRadius: 2,
              mt: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
            onClick={() => window.open(post.photo_url || post.image_url, '_blank')}
          />
        )}
        <PostComments postId={post.id} postType={post.type} />
      </CardContent>
    </Card>
  );
};

/**
 * AnnouncementCard Component
 * Renders ANNOUNCEMENT type as highlighted inline card
 */
const AnnouncementCard = ({ post }) => {
  const authorName = post.author_person_name || post.author_user;
  const initials = getInitials(authorName);

  return (
    <Card
      sx={{
        mb: 2,
        flexShrink: 0, // Prevent compression
        bgcolor: 'warning.light',
        border: '2px solid',
        borderColor: 'warning.main',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            {initials}
          </Avatar>
        }
        title={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {post.author_person_id ? (
              <MuiLink
                component={Link}
                to={`/people/${post.author_person_id}`}
                color="inherit"
                sx={{
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                }}
              >
                <Typography variant="subtitle1" component="span">
                  {post.author_user}
                </Typography>
              </MuiLink>
            ) : (
              <Typography variant="subtitle1" component="span">
                {post.author_user}
              </Typography>
            )}
            {post.author_person_name && (
              <Typography variant="body2" color="text.secondary" component="span">
                ({post.author_person_name})
              </Typography>
            )}
            <Chip
              icon={<AnnouncementIcon />}
              label="ANNOUNCEMENT"
              size="small"
              color="warning"
              variant="filled"
            />
          </Box>
        }
        subheader={formatRelativeTime(post.created_at)}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: (post.photo_url || post.image_url) ? 2 : 0, fontSize: '1rem' }}>
          {post.text}
        </Typography>
        {(post.photo_url || post.image_url) && (
          <Box
            component="img"
            src={post.photo_url || post.image_url}
            alt="Announcement"
            sx={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
              borderRadius: 2,
              mt: 2,
              cursor: 'pointer',
            }}
            onClick={() => window.open(post.photo_url || post.image_url, '_blank')}
          />
        )}
        <PostComments postId={post.id} postType={post.type} />
      </CardContent>
    </Card>
  );
};

/**
 * Feed Page
 * Displays posts for the active family
 */
const Feed = () => {
  const { activeFamilyId, activeFamilyName } = useFamily();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [myPersonId, setMyPersonId] = useState(null);
  const navigate = useNavigate();
  const observerTarget = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const didInitialScrollRef = useRef(false);

  // Composer state
  const [composerText, setComposerText] = useState('');
  const [composerType, setComposerType] = useState('MESSAGE');
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState(null);
  
  // File upload state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedVoiceMessage, setSelectedVoiceMessage] = useState(null);
  const [selectedFileAttachment, setSelectedFileAttachment] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [voicePreview, setVoicePreview] = useState(null);
  const [fileAttachmentPreview, setFileAttachmentPreview] = useState(null);
  
  // File input refs
  const photoInputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const fileAttachmentInputRef = useRef(null);

  // Fetch current user profile to determine message alignment
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (isAuthenticated) {
        try {
          const profile = await getProfile();
          setCurrentUsername(profile.username);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };
    fetchCurrentUser();
  }, [isAuthenticated]);

  // Fetch current user's person ID in active family
  useEffect(() => {
    const fetchMyPersonId = async () => {
      if (!activeFamilyId || !isAuthenticated) {
        setMyPersonId(null);
        return;
      }

      try {
        const personId = await getCurrentUserPersonId(activeFamilyId);
        setMyPersonId(personId);
      } catch (err) {
        console.error('Error fetching person ID:', err);
        setMyPersonId(null);
      }
    };

    fetchMyPersonId();
  }, [activeFamilyId, isAuthenticated]);

  useEffect(() => {
    // Redirect to family selection if no active family
    if (!activeFamilyId) {
      navigate('/app/families');
      return;
    }

    // Reset posts and page when family changes
    setPosts([]);
    setPage(1);
    didInitialScrollRef.current = false;
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
      
      // Reverse posts so newest appears at bottom (chat style)
      const reversedNewPosts = [...newPosts].reverse();
      
      if (reset) {
        setPosts(reversedNewPosts);
      } else {
        // For infinite scroll, prepend older posts at the top
        setPosts((prevPosts) => [...reversedNewPosts, ...prevPosts]);
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

  // Infinite scroll observer - load older messages when scrolling to top
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

  // Initial scroll to bottom when posts are first loaded
  useEffect(() => {
    if (!didInitialScrollRef.current && posts.length > 0 && !loading) {
      didInitialScrollRef.current = true;
      setTimeout(() => {
        scrollToBottom('auto');
      }, 100);
    }
  }, [posts.length, loading]);

  /**
   * Handle composer submit
   */
  const handleComposerSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeFamilyId) {
      setComposerError('No active family selected.');
      return;
    }

    // Allow submission if there's text or a file
    const hasText = composerText.trim();
    const hasFile = selectedPhoto || selectedVoiceMessage || selectedFileAttachment;
    
    if (!hasText && !hasFile) {
      setComposerError('Please add text or a file.');
      return;
    }

    try {
      setComposerLoading(true);
      setComposerError(null);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Feed/index.jsx:591',message:'Creating post - input data',data:{familyId:activeFamilyId,type:composerType,textLength:composerText.trim().length,hasPhoto:!!selectedPhoto,hasVoice:!!selectedVoiceMessage,hasFile:!!selectedFileAttachment,myPersonId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const newPost = await createPost({
        familyId: activeFamilyId,
        type: composerType,
        text: composerText.trim() || '', // Allow empty text if file is provided
        imageUrl: undefined, // Not used for messages/posts from composer
        photo: selectedPhoto,
        voiceMessage: selectedVoiceMessage,
        fileAttachment: selectedFileAttachment,
        authorPersonId: myPersonId, // Include person ID so posts appear in profile
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Feed/index.jsx:603',message:'Post created - response data',data:{postId:newPost.id,type:newPost.type,authorPersonId:newPost.author_person_id,authorUser:newPost.author_user,familyId:newPost.family_id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Append new post to feed (optimistic update) - appears at bottom
      setPosts((prevPosts) => [...prevPosts, newPost]);

      // Clear composer
      setComposerText('');
      setComposerType('MESSAGE');
      clearFiles();
      
      // Scroll to bottom after a brief delay to allow DOM update
      setTimeout(() => {
        scrollToBottom('auto');
      }, 100);
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setComposerError('Authentication failed. Please log in again.');
        } else if (err.response.status === 403) {
          setComposerError('You are not a member of this family.');
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
            setComposerError(errorMessages || 'Failed to create post. Please try again.');
          } else {
            setComposerError(errorData?.error || 'Failed to create post. Please try again.');
          }
        }
      } else {
        setComposerError('Network error. Please check your connection.');
      }
    } finally {
      setComposerLoading(false);
    }
  };

  /**
   * Handle composer type toggle
   */
  const handleComposerTypeChange = (event, newType) => {
    if (newType !== null) {
      setComposerType(newType);
      // Clear files when switching types
      clearFiles();
    }
  };

  /**
   * Validate and handle photo selection
   */
  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setComposerError('Please select an image file.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setComposerError('Photo size must be less than 10MB.');
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setComposerError(null);
  };

  /**
   * Validate and handle voice message selection
   */
  const handleVoiceSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setComposerError('Please select an audio file.');
      return;
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setComposerError('Voice message size must be less than 25MB.');
      return;
    }

    setSelectedVoiceMessage(file);
    setVoicePreview(URL.createObjectURL(file));
    setComposerError(null);
    // Clear file attachment if voice is selected
    if (selectedFileAttachment) {
      setSelectedFileAttachment(null);
      if (fileAttachmentPreview) {
        URL.revokeObjectURL(fileAttachmentPreview);
        setFileAttachmentPreview(null);
      }
    }
  };

  /**
   * Validate and handle file attachment selection
   */
  const handleFileAttachmentSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setComposerError('File size must be less than 50MB.');
      return;
    }

    setSelectedFileAttachment(file);
    setFileAttachmentPreview(URL.createObjectURL(file));
    setComposerError(null);
    // Clear voice message if file attachment is selected
    if (selectedVoiceMessage) {
      setSelectedVoiceMessage(null);
      if (voicePreview) {
        URL.revokeObjectURL(voicePreview);
        setVoicePreview(null);
      }
    }
  };

  /**
   * Clear all selected files
   */
  const clearFiles = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    if (voicePreview) {
      URL.revokeObjectURL(voicePreview);
    }
    if (fileAttachmentPreview) {
      URL.revokeObjectURL(fileAttachmentPreview);
    }
    setSelectedPhoto(null);
    setSelectedVoiceMessage(null);
    setSelectedFileAttachment(null);
    setPhotoPreview(null);
    setVoicePreview(null);
    setFileAttachmentPreview(null);
    // Reset file inputs
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (voiceInputRef.current) voiceInputRef.current.value = '';
    if (fileAttachmentInputRef.current) fileAttachmentInputRef.current.value = '';
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (voicePreview) URL.revokeObjectURL(voicePreview);
      if (fileAttachmentPreview) URL.revokeObjectURL(fileAttachmentPreview);
    };
  }, [photoPreview, voicePreview, fileAttachmentPreview]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = (behavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    } else if (messagesContainerRef.current) {
      // Fallback: scroll container to bottom
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll to bottom only when new message is added (not on initial load or pagination)
  const prevPostsLengthRef = useRef(0);
  useEffect(() => {
    // Only auto-scroll if a new message was added (length increased)
    if (posts.length > prevPostsLengthRef.current && prevPostsLengthRef.current > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    prevPostsLengthRef.current = posts.length;
  }, [posts.length]);

  if (!activeFamilyId) {
    return null; // Will redirect via useEffect
  }

  if (loading && posts.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
        <Box sx={{ flex: 1, p: 2 }}>
          <SkeletonPostList count={3} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Box>
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
            <Button variant="contained" onClick={() => fetchPosts(activeFamilyId, page)}>
              Retry
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <PageTransition>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: 'background.default',
          minHeight: 0,
        }}
      >
        {/* Chat Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {getInitials(activeFamilyName || 'F')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={600} noWrap>
              {activeFamilyName || 'Family Feed'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {posts.length} {posts.length === 1 ? 'message' : 'messages'}
            </Typography>
          </Box>
          <IconButton size="small">
            <SearchIcon />
          </IconButton>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Paper>

        {/* Messages Area */}
        <Box
          ref={messagesContainerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Important: allows flex child to shrink
            // WhatsApp-like background pattern
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 2,
                pb: 8, // Leave space so composer does not cover latest messages
              }}
            >
            {loading && posts.length === 0 ? (
              <SkeletonPostList count={3} />
            ) : posts.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  p: 4,
                  minHeight: 'auto',
                }}
              >
                <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No messages yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start the conversation with your family!
                </Typography>
              </Box>
            ) : (
              <>
                {/* Infinite scroll trigger at top (for loading older messages) */}
                {pagination?.hasNext && (
                  <Box ref={observerTarget} sx={{ py: 2, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {loadingMore && <CircularProgress size={24} />}
                  </Box>
                )}
              {posts.map((post) => {
                // Conditionally render based on post type
                if (post.type === 'MESSAGE') {
                  return <MessageBubble key={post.id} post={post} currentUsername={currentUsername} />;
                } else if (post.type === 'POST') {
                  return <PostCard key={post.id} post={post} />;
                } else if (post.type === 'ANNOUNCEMENT') {
                  return <AnnouncementCard key={post.id} post={post} />;
                }
                // Fallback to PostCard for unknown types
                return <PostCard key={post.id} post={post} />;
              })}
                {/* Scroll anchor at bottom - minimal height, no extra space */}
                <Box ref={messagesEndRef} sx={{ height: 0, minHeight: 0, flexShrink: 0 }} />
                {!pagination?.hasNext && posts.length > 0 && (
                  <Box textAlign="center" py={0.5} sx={{ flexShrink: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      End of messages
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
          }}
        >
          {composerError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setComposerError(null)}>
              {composerError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleComposerSubmit}>
            {/* File Previews */}
            {(photoPreview || voicePreview || fileAttachmentPreview) && (
              <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {photoPreview && (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={photoPreview}
                      alt="Preview"
                      sx={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedPhoto(null);
                        URL.revokeObjectURL(photoPreview);
                        setPhotoPreview(null);
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                        width: 24,
                        height: 24,
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
                {voicePreview && (
                  <Chip
                    icon={<MicIcon />}
                    label={`Voice: ${selectedVoiceMessage?.name || 'audio'}`}
                    onDelete={() => {
                      setSelectedVoiceMessage(null);
                      URL.revokeObjectURL(voicePreview);
                      setVoicePreview(null);
                      if (voiceInputRef.current) voiceInputRef.current.value = '';
                    }}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
                {fileAttachmentPreview && (
                  <Chip
                    icon={<InsertDriveFileIcon />}
                    label={`File: ${selectedFileAttachment?.name || 'attachment'}`}
                    onDelete={() => {
                      setSelectedFileAttachment(null);
                      URL.revokeObjectURL(fileAttachmentPreview);
                      setFileAttachmentPreview(null);
                      if (fileAttachmentInputRef.current) fileAttachmentInputRef.current.value = '';
                    }}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            )}
            
            <Box display="flex" gap={1} alignItems="flex-end" mb={1}>
              {/* File Input Buttons */}
              <Box display="flex" gap={0.5}>
                {composerType === 'MESSAGE' ? (
                  <>
                    <input
                      type="file"
                      ref={voiceInputRef}
                      accept="audio/*"
                      onChange={handleVoiceSelect}
                      style={{ display: 'none' }}
                    />
                    <input
                      type="file"
                      ref={fileAttachmentInputRef}
                      onChange={handleFileAttachmentSelect}
                      style={{ display: 'none' }}
                    />
                    <Tooltip title="Voice message">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => voiceInputRef.current?.click()}
                        disabled={composerLoading || !!selectedFileAttachment}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <MicIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Attach file">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => fileAttachmentInputRef.current?.click()}
                        disabled={composerLoading || !!selectedVoiceMessage}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <AttachFileIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                    />
                    <Tooltip title="Add photo">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={composerLoading}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
              
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder={composerType === 'MESSAGE' ? 'Type a message...' : 'Write a post...'}
                disabled={composerLoading}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    bgcolor: 'background.default',
                  },
                }}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={(!composerText.trim() && !selectedPhoto && !selectedVoiceMessage && !selectedFileAttachment) || composerLoading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  minWidth: 44,
                  minHeight: 44,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                {composerLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              </IconButton>
            </Box>
            <Box display="flex" gap={0.5} justifyContent="center">
              <ToggleButtonGroup
                value={composerType}
                exclusive
                onChange={handleComposerTypeChange}
                size="small"
                disabled={composerLoading}
              >
                <ToggleButton value="MESSAGE" size="small">
                  <MessageIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Message
                </ToggleButton>
                <ToggleButton value="POST" size="small">
                  <ArticleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Post
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Paper>
      </Box>
    </PageTransition>
  );
};

export default Feed;
