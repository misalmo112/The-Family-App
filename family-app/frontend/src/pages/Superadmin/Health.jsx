import { Typography, Box } from '@mui/material';

const Health = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        System Health
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page will display system health status and monitoring information.
      </Typography>
    </Box>
  );
};

export default Health;
