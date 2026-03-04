import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  Grid,
} from '@mui/material';

const features = [
  {
    title: 'Private family space',
    detail: 'A secure, invite-only network designed for families only.',
  },
  {
    title: 'Relationship-aware',
    detail: 'See people as father, mother, cousin, or child automatically.',
  },
  {
    title: 'Living timeline',
    detail: 'Chat-first feed with posts, announcements, and history.',
  },
  {
    title: 'Multi-family ready',
    detail: 'One account can belong to multiple families.',
  },
];

const Welcome = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top left, rgba(0,194,168,0.25), transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,107,74,0.2), transparent 45%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            sx={{ borderRadius: 999 }}
          >
            Login
          </Button>
        </Box>

        <Stack spacing={4} sx={{ mt: { xs: 4, md: 8 } }}>
          <Stack spacing={2} sx={{ maxWidth: 720 }}>
            <Chip label="Family Social Network" color="primary" sx={{ width: 'fit-content' }} />
            <Typography variant="h2" component="h1">
              Your family, beautifully connected.
            </Typography>
            <Typography variant="h6" color="text.secondary">
              A private, relationship-aware social space that keeps family stories,
              relationships, and everyday moments alive.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created by Misal Kunhi
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} md={6} key={feature.title}>
                <Card elevation={0} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.detail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color="primary"
              size="large"
              sx={{ borderRadius: 999 }}
            >
              Enter the Family Network
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Welcome;
