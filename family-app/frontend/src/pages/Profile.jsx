import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Chip,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';
import { getProfile } from '../services/auth';
import { useFamily } from '../context/FamilyContext';
import { getFeed } from '../services/feed';
import { getPersons } from '../services/graph';
import { SkeletonPostList } from '../components/Loading/SkeletonPost';
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
 * PostCard Component for Profile page
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
            }}
            onClick={() => window.open(post.photo_url || post.image_url, '_blank')}
          />
        )}
        <PostComments postId={post.id} postType={post.type} />
      </CardContent>
    </Card>
  );
};

const Profile = () => {
  // Profile state (minimal - only for username check)
  const [profile, setProfile] = useState(null);

  // Posts section state
  const { activeFamilyId } = useFamily();
  const [myPersonId, setMyPersonId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [showAllFamilies, setShowAllFamilies] = useState(false);
  const [checkingPersonId, setCheckingPersonId] = useState(true);

  // Load profile on mount (minimal - only for username)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Find user's person ID in active family
  useEffect(() => {
    const findMyPersonId = async () => {
      if (!activeFamilyId || !profile?.username) {
        setCheckingPersonId(false);
        return;
      }

      try {
        // Get all persons in the active family
        const persons = await getPersons({ familyId: activeFamilyId });
        
        // Try to find the person ID by attempting to fetch posts with scope=all_families
        // The first person ID that works is the user's person ID
        for (const person of persons) {
          try {
            await getFeed({
              authorPersonId: person.id,
              type: 'POST',
              scope: 'all_families',
              page: 1,
            });
            // If successful, this is the user's person ID
            setMyPersonId(person.id);
            setCheckingPersonId(false);
            return;
          } catch (err) {
            // Not this person, continue
            continue;
          }
        }
        
        // If no person worked with scope=all_families, use the first person that has posts
        // or just use the first person as fallback
        if (persons.length > 0) {
          setMyPersonId(persons[0].id);
        }
      } catch (err) {
        console.error('Error finding person ID:', err);
      } finally {
        setCheckingPersonId(false);
      }
    };

    if (profile) {
      findMyPersonId();
    }
  }, [activeFamilyId, profile]);

  // Fetch posts when person ID or toggle changes
  useEffect(() => {
    if (!myPersonId || checkingPersonId) {
      return;
    }

    // If not showing all families, we need activeFamilyId
    if (!showAllFamilies && !activeFamilyId) {
      return;
    }

    fetchMyPosts();
  }, [myPersonId, activeFamilyId, showAllFamilies, checkingPersonId]);

  const fetchMyPosts = async () => {
    if (!myPersonId) return;

    try {
      setPostsLoading(true);
      setPostsError(null);

      const params = {
        authorPersonId: myPersonId,
        type: 'POST',
        page: 1,
      };

      if (showAllFamilies) {
        params.scope = 'all_families';
      } else {
        params.familyId = activeFamilyId;
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Profile.jsx:228',message:'Profile fetchMyPosts - query params',data:{myPersonId,params:JSON.stringify(params),showAllFamilies,activeFamilyId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const data = await getFeed(params);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Profile.jsx:241',message:'Profile fetchMyPosts - results',data:{resultCount:data.results?.length||0,postIds:data.results?.map(p=>p.id)||[],postTypes:data.results?.map(p=>p.type)||[],postAuthorPersonIds:data.results?.map(p=>p.author_person_id)||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      setPosts(data.results || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (err.response?.status === 403) {
        setPostsError('You do not have permission to view posts.');
      } else {
        setPostsError('Failed to load posts. Please try again.');
      }
    } finally {
      setPostsLoading(false);
    }
  };


  return (
    <Container maxWidth="md">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Profile
      </Typography>

      {/* My Posts Section */}
      {myPersonId && (
        <Card elevation={0} sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h5" component="h2">
                My Posts
              </Typography>
              {activeFamilyId && (
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

            {postsError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPostsError(null)}>
                {postsError}
              </Alert>
            )}

            {postsLoading ? (
              <SkeletonPostList count={2} />
            ) : posts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showAllFamilies
                    ? 'You have not posted anything across any family.'
                    : 'You have not posted anything in this family.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} showFamilyLabel={showAllFamilies} />
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Profile;
