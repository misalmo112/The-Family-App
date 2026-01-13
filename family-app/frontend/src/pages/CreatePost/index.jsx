import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  Article as ArticleIcon,
  Announcement as AnnouncementIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useFamily } from '../../context/FamilyContext';
import { createPost } from '../../services/feed';
import PageTransition from '../../components/PageTransition';

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
  const [textError, setTextError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to family selection if no active family
    if (!activeFamilyId) {
      navigate('/families');
      return;
    }
  }, [activeFamilyId, navigate]);

  const validateText = (value) => {
    if (!value.trim()) {
      setTextError('Text is required.');
      return false;
    }
    setTextError('');
    return true;
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    if (textError) {
      validateText(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeFamilyId) {
      setError('No active family selected.');
      return;
    }

    if (!validateText(text)) {
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
    <PageTransition>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Create Post
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="post-type-label">Post Type</InputLabel>
            <Select
              labelId="post-type-label"
              id="post-type"
              value={type}
              label="Post Type"
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
              required
            >
              <MenuItem value="POST">
                <Box display="flex" alignItems="center" gap={1}>
                  <ArticleIcon fontSize="small" />
                  <span>Post</span>
                </Box>
              </MenuItem>
              <MenuItem value="ANNOUNCEMENT">
                <Box display="flex" alignItems="center" gap={1}>
                  <AnnouncementIcon fontSize="small" />
                  <span>Announcement</span>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Post Text"
            multiline
            rows={6}
            value={text}
            onChange={handleTextChange}
            onBlur={() => validateText(text)}
            error={!!textError}
            helperText={textError || 'Share what\'s on your mind with your family'}
            required
            disabled={loading}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 5000 }}
          />

          <TextField
            fullWidth
            label="Image URL"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            helperText="Optional: Add an image to your post"
            disabled={loading}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <ImageIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate('/feed')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !text.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <ArticleIcon />}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </Stack>
        </Box>
      </Paper>
      </Container>
    </PageTransition>
  );
};

export default CreatePost;
