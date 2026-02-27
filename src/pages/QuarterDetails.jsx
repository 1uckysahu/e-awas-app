import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
    Container, Grid, Card, CardMedia, CardContent, Typography, Button, 
    Box, CircularProgress, Alert, Chip, List, ListItem, ListItemIcon, 
    ListItemText, Dialog, DialogTitle, DialogContent, Snackbar, Tooltip
} from '@mui/material';
import { CheckCircle, Cancel, LocationCity, Home, Category, EventAvailable } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import ApplyForQuarterForm from '../components/ApplyForQuarterForm';

const QuarterDetails = () => {
  const { quarterId } = useParams();
  const navigate = useNavigate();
  const [quarter, setQuarter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true); 

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openApplyForm, setOpenApplyForm] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData({ id: userDocSnap.id, ...userDocSnap.data() });
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setUserLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchQuarter = async () => {
      try {
        const docRef = doc(db, 'quarters', quarterId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuarter({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(t('quarter_not_found'));
        }
      } catch (err) {
        console.error(err);
        setError(t('error_fetching_quarter_details'));
      } finally {
        setLoading(false);
      }
    };
    if(quarterId) fetchQuarter();
  }, [quarterId, t]);

  const handleImageClick = (index) => {
    setSelectedImage(index);
    setLightboxOpen(true);
  }

  const handleApplyClick = () => {
    if (user) {
        if(userData?.userType === 'government'){
            setOpenApplyForm(true);
        }
    } else {
      navigate('/login');
    }
  };

  const handleCloseApplyForm = (success) => {
    setOpenApplyForm(false);
    if (success) {
      setSnackbar({ open: true, message: t('application_submitted_successfully'), severity: 'success' });
    } else if (success === false) {
      setSnackbar({ open: true, message: t('application_submission_failed'), severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  if (!quarter) {
    return null;
  }

  const { 
      name, 
      address,
      location,
      quarterType,
      available,
      details,
      assetDetails,
      mainImageUrl,
      otherImageUrls
  } = quarter;

  const allImages = [mainImageUrl, ...(otherImageUrls || [])].filter(Boolean);
  
  const renderApplyButton = () => {
      if (userLoading) {
          return <CircularProgress />;
      }

      if (!user) {
          return (
              <Button 
                  onClick={handleApplyClick}
                  variant="contained" 
                  size="large" 
                  fullWidth
              >
                  {t('login_to_apply')}
              </Button>
          );
      }

      if (userData?.userType === 'government') {
          return (
              <Button 
                  onClick={handleApplyClick}
                  variant="contained" 
                  size="large" 
                  fullWidth
              >
                  {t('apply_now')}
              </Button>
          );
      } else {
          return (
              <Tooltip title={t('onlyGovUsersCanApply')} arrow>
                  <span>
                      <Button 
                          variant="contained" 
                          size="large" 
                          fullWidth
                          disabled
                          sx={{ 
                              background: 'rgba(0, 0, 0, 0.12)', 
                              boxShadow: 'none', 
                              '&:hover': { 
                                  background: 'rgba(0, 0, 0, 0.12)', 
                                  boxShadow: 'none' 
                              } 
                          }}
                      >
                          {t('apply_now')}
                      </Button>
                  </span>
              </Tooltip>
          );
      }
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Card elevation={3}>
        <CardMedia
          component="img"
          height="400"
          image={mainImageUrl || 'https://via.placeholder.com/1200x400?text=Quarter+Image'}
          alt={name}
          onClick={() => handleImageClick(0)}
          sx={{ cursor: 'pointer' }}
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" component="h1" gutterBottom>{name}</Typography>
              <List sx={{ width: '100%' }}>
                  <ListItem disablePadding><ListItemIcon><LocationCity color="primary"/></ListItemIcon><ListItemText primary={address} /></ListItem>
                  <ListItem disablePadding><ListItemIcon><Home color="primary"/></ListItemIcon><ListItemText primary={location} /></ListItem>
                  <ListItem disablePadding><ListItemIcon><Category color="primary"/></ListItemIcon><ListItemText primary={quarterType} /></ListItem>
                  <ListItem disablePadding><ListItemIcon><EventAvailable color="primary"/></ListItemIcon><ListItemText primary={available ? t('available') : t('not_available')} /></ListItem>
              </List>
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>{t('description')}</Typography>
              <Typography variant="body1">{details || t('no_details_provided')}</Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>{t('asset_details')}</Typography>
              {assetDetails && assetDetails.length > 0 ? (
                <List>{assetDetails.map((asset, index) => <ListItem key={index}>{asset}</ListItem>)}</List>
              ) : (
                <Typography variant="body2">{t('no_asset_details_provided')}</Typography>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Chip 
                    icon={available ? <CheckCircle /> : <Cancel />} 
                    label={available ? t('available') : t('not_available')} 
                    color={available ? "success" : "error"} 
                    sx={{ mb: 2 }} 
                />
                {available && renderApplyButton()}
              </Box>
            </Grid>
          </Grid>

          {allImages.length > 1 && (
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>{t('more_images')}</Typography>
                <Grid container spacing={2}>
                    {allImages.slice(1).map((url, index) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                            <CardMedia 
                                component="img" 
                                height="150" 
                                image={url} 
                                alt={`${name} ${index + 2}`} 
                                onClick={() => handleImageClick(index + 1)}
                                sx={{ cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={allImages.map(url => ({ src: url }))}
          index={selectedImage}
          plugins={[Zoom]}
      />

      <Dialog open={openApplyForm} onClose={() => handleCloseApplyForm(null)}>
        <DialogTitle>{t('apply_for_quarter_title_with_name', { quarterName: quarter?.name })}</DialogTitle>
        <DialogContent>
            {quarter && (
                <ApplyForQuarterForm
                    quarter={quarter}
                    onSuccess={() => handleCloseApplyForm(true)}
                    onError={() => handleCloseApplyForm(false)}
                />
            )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default QuarterDetails;