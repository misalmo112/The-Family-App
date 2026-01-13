import React from 'react';
import { Card, CardContent, CardHeader, Skeleton, Box } from '@mui/material';

const SkeletonPost = () => {
  return (
    <Card>
      <CardHeader
        avatar={<Skeleton variant="circular" width={40} height={40} />}
        title={<Skeleton variant="text" width="60%" />}
        subheader={<Skeleton variant="text" width="30%" />}
      />
      <CardContent>
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" height={20} />
      </CardContent>
    </Card>
  );
};

export const SkeletonPostList = ({ count = 3 }) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <SkeletonPost />
        </Box>
      ))}
    </Box>
  );
};

export default SkeletonPost;
