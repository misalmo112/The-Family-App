import { Fade } from '@mui/material';

/**
 * PageTransition Component
 * Provides smooth fade-in transitions for page content
 */
const PageTransition = ({ children, ...props }) => {
  return (
    <Fade in timeout={300} {...props}>
      <div>{children}</div>
    </Fade>
  );
};

export default PageTransition;
