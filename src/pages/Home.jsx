import { Typography, Container, Box, Grid, Paper, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';

// Keyframes for animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeroBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  color: theme.palette.common.white,
  padding: theme.spacing(12, 2),
  textAlign: 'center',
  background: 'url(https://i.ibb.co/xqTcfTGp/Gemini-Generated-Image-goi6a7goi6a7goi6.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
    animation: `${fadeIn} 1s ease-out forwards`,
  }
}));

const OfferingsSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(12, 2),
    backgroundColor: '#f4f6f8',
}));

const OfferingCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'bgimage',
})(({ theme, bgimage }) => ({
  position: 'relative',
  color: theme.palette.common.white,
  height: '400px',
  borderRadius: theme.shape.borderRadius * 4,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(4),
  background: `url(${bgimage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.1) 100%)',
    transition: 'background-color 0.4s ease',
  },
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 15px 12px rgba(0,0,0,0.22)',
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
    transition: 'transform 0.4s ease'
  },
  '&:hover > .offering-content': {
      transform: 'translateY(-10px)'
  }
}));

const FaqSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(12, 2),
    backgroundColor: theme.palette.background.default,
}));

const Footer = styled('footer')(({ theme }) => ({
    position: 'relative',
    padding: theme.spacing(8, 2),
    color: 'white',
    textAlign: 'center',
    overflow: 'hidden',
}));

const BackgroundVideo = styled('video')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 'auto',
  height: 'auto',
  minWidth: '100%',
  minHeight: '100%',
  transform: 'translate(-50%, -50%)',
  zIndex: 0,
  objectFit: 'cover',
});

const VideoOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(44, 62, 80, 0.5)',
  zIndex: 1,
});


const Home = () => {
  const { t } = useTranslation();

  const faqs = [
    { q: t('booking_priority_title'), a: t('booking_priority_desc'), icon: <GavelIcon /> },
    { q: t('charges_payment'), a: t('charges_payment_desc'), icon: <PaymentIcon /> },
    { q: t('faq_password_reset_q'), a: t('faq_password_reset_a'), icon: <HelpOutlineIcon /> },
    { q: t('faq_multiple_quarters_q'), a: t('faq_multiple_quarters_a'), icon: <HelpOutlineIcon /> },
  ];

  return (
    <Box>
      <HeroBox>
        <Container maxWidth="md">
          <Box
            component="img"
            src="https://i.ibb.co/ycCH30Qh/Gemini-Generated-Image-1ewk341ewk341ewk.png"
            alt="E-Awas Logo"
            sx={{
              height: { xs: '100px', md: '150px' },
              mb: 4,
              filter: 'drop-shadow(0 0 15px rgba(255, 152, 0, 0.6))',
            }}
          />
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontSize: { xs: '2.2rem', sm: '3.5rem', md: '4.5rem' }, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <Trans
              i18nKey="welcome_message_trans"
              components={{ orange: <span style={{ color: '#ff9800' }} /> }}
            />
          </Typography>
          <Typography variant="h5" component="p" sx={{ color: '#ff9800', mb: 5, fontSize: { xs: '1.1rem', md: '1.5rem' }, fontWeight: 300, maxWidth: '700px', margin: '0 auto' }}>
            {t('tagline')}
          </Typography>
        </Container>
      </HeroBox>

      <OfferingsSection>
        <Container maxWidth="xl">
            <Typography variant="h2" component="h2" align="center" gutterBottom sx={{ mb: 10, fontWeight: 'bold', color: '#34495e' }}>
                {t('explore_our_offerings')}
            </Typography>
            <Grid container spacing={2} justifyContent="center">
                {/* Updated Grid sizing here */}
                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <OfferingCard bgimage="https://i.ibb.co/JwFfPQCL/Gemini-Generated-Image-nrp1ypnrp1ypnrp1.png">
                        <Box className="offering-content">
                            <AssuredWorkloadIcon sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h3" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                                {t('government_quarters')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, px: 2 }}>
                                {t('find_apply_quarters')}
                            </Typography>
                             <Button variant="contained" size="large" component={Link} to="/quarters" sx={{ borderRadius: '50px', px: 5, py: 1.5, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(255, 152, 0, 0.4)', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                                {t('browse_quarters')}
                            </Button>
                        </Box>
                    </OfferingCard>
                </Grid>
                {/* Updated Grid sizing here */}
                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <OfferingCard bgimage="https://i.ibb.co/N2V8FCKJ/Gemini-Generated-Image-tou6botou6botou6.png">
                        <Box className="offering-content">
                             <HolidayVillageIcon sx={{ fontSize: 60, mb: 2 }} />
                             <Typography variant="h3" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                                {t('guest_houses_title')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, px: 2 }}>
                                {t('book_guest_houses')}
                            </Typography>
                             <Button variant="contained" size="large" component={Link} to="/guest-houses" sx={{ borderRadius: '50px', px: 5, py: 1.5, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(255, 152, 0, 0.4)', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}>
                                {t('explore_guest_houses')}
                            </Button>
                        </Box>
                    </OfferingCard>
                </Grid>
            </Grid>
        </Container>
      </OfferingsSection>

      <FaqSection>
        <Container maxWidth="md">
            <Typography variant="h2" component="h2" align="center" gutterBottom sx={{ mb: 10, fontWeight: 'bold', color: '#34495e' }}>
                {t('faqs')}
            </Typography>
            {faqs.map((faq, index) => (
                <Accordion key={index} sx={{ 
                    mb: 2, 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: '16px 0' }
                }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: 'primary.main' }}>{faq.icon}</Box>
                        <Typography sx={{ fontWeight: '600' }}>{faq.q}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography color="text.secondary">{faq.a}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
      </FaqSection>

      <Footer>
        <BackgroundVideo autoPlay loop muted playsInline>
            <source src="/bgvideo.mp4" type="video/mp4" />
        </BackgroundVideo>
        <VideoOverlay />
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>{t('need_further_assistance')}</Typography>
            <Typography sx={{ mb: 2, fontSize: '1.1rem', maxWidth: '700px', mx: 'auto' }}>
                 <Trans
                    i18nKey="further_assistance_desc"
                    values={{
                        email: t('support_email'),
                        phone: t('support_phone')
                    }}
                    components={{
                        emailLink: <a href={`mailto:${t('support_email')}`} style={{color: '#ff9800', textDecoration: 'none', fontWeight: 'bold'}} />,
                        phone: <span style={{color: '#ff9800', fontWeight: 'bold'}} />
                    }}
                />
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{t('copyright', { year: new Date().getFullYear() })}</Typography>
          </Container>
      </Footer>
    </Box>
  );
};

export default Home;