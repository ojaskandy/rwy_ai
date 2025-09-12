import React from 'react';
import { Box, Container, Typography, Avatar, Stack, Button } from '@mui/material';
import { Link } from 'wouter'; // Import Link from wouter
import ArshiaImage from '../../../attached_assets/arshia_rwyai.jpg'; // Changed from PNG to JPG
import OjasImage from '../../../attached_assets/ojas_rwyai.jpg';

const Team = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFF0F5', py: 8 }}> {/* Light pink background for the whole page */}
      <Container maxWidth="md" sx={{ bgcolor: 'white', borderRadius: '24px', p: { xs: 3, md: 6 }, boxShadow: '0 10px 40px rgba(255, 105, 180, 0.1)' }}>
        {/* Back to Welcome Button */}
        <Box sx={{ mb: 4 }}>
          <Link href="/welcome" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" sx={{ borderColor: '#FF69B4', color: '#FF69B4', '&:hover': { bgcolor: '#FFF0F5' } }}>
              &lt; Back to Welcome Page
            </Button>
          </Link>
        </Box>

        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{
            fontWeight: 'bold',
            // Pink/Purple gradient for text
            background: '-webkit-linear-gradient(45deg, #FF69B4 30%, #BA55D3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 6,
          }}
        >
          Meet the Team
        </Typography>

        <Stack spacing={6} sx={{ mt: 6 }}>
          {/* Arshia's Profile */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, p: { xs: 2, md: 4 }, borderRadius: '24px', boxShadow: '0 8px 30px rgba(255, 105, 180, 0.1)', bgcolor: '#FFFAFA' }}> {/* Lighter background for cards */}
            <Avatar alt="Arshia" src={ArshiaImage} sx={{ width: 180, height: 180, borderRadius: '24px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} variant="square" />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                Arshia - Co-Founder & CEO
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#555' }}>
                Miss Teen India USA 2024 and Miss Teen India Worldwide 2nd Runner-Up. Arshia leads company vision and growth strategy, bringing first-hand pageant expertise to product development. Her unique insights ensure Runway AI deeply understands and serves its users' needs.
              </Typography>
            </Box>
          </Box>

          {/* Ojas's Profile */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, p: { xs: 2, md: 4 }, borderRadius: '24px', boxShadow: '0 8px 30px rgba(255, 105, 180, 0.1)', bgcolor: '#FFFAFA' }}> {/* Lighter background for cards */}
            <Avatar alt="Ojas" src={OjasImage} sx={{ width: 180, height: 180, borderRadius: '24px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} variant="square" />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                Ojas - Co-Founder & CTO
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#555' }}>
                Experienced builder with multiple successful app launches. Ojas architected Runway AI's platform from the ground up, handling everything from AI systems to mobile deployment across iOS and Android. His technical expertise is the backbone of the platform.
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            href="mailto:arshia.x.kathpalia@gmail.com,ojaskandy@gmail.com?subject=Application to Join Runway AI Team"
            sx={{
              borderRadius: '999px',
              px: 5, 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 4px 20px rgba(255, 105, 135, 0.3)',
              backgroundImage: 'linear-gradient(to right, #ff6b8d, #ff3d6a)',
              '&:hover': {
                backgroundImage: 'linear-gradient(to right, #ff3d6a, #ff6b8d)',
                boxShadow: '0 6px 25px rgba(255, 105, 135, 0.4)',
              },
            }}
          >
            Apply to Join Our Team
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Team;
