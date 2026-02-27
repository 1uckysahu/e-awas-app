import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
    Container, Typography, Card, CardMedia, Grid, Box, CircularProgress, 
    Button, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, Link, 
    Dialog, DialogTitle, DialogContent, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocationCity, Place, Money } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import BookGuestHouse from './BookGuestHouse';

const GuestHouseDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [guestHouse, setGuestHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchGuestHouse = async () => {
      try {
        const docRef = doc(db, 'guesthouses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGuestHouse({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching guest house details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGuestHouse();
  }, [id]);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleBookingSuccess = () => {
    handleCloseDialog();
    navigate('/dashboard');
  };

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  }

  if (!guestHouse) {
    return <Container><Typography variant="h5" color="error">{t('guest_house_not_found')}</Typography></Container>;
  }

  const { 
    name, address, mainImageUrl, otherImageUrls, 
    details, price, location, mapLocationUrl 
  } = guestHouse;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4}, borderRadius: '12px' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <CardMedia
              component="img"
              image={mainImageUrl || 'https://via.placeholder.com/600x400'}
              alt={name}
              sx={{ borderRadius: '8px', maxHeight: { xs: 300, md: 500 }, objectFit: 'cover' }}
            />
            {otherImageUrls && otherImageUrls.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>{t('more_images')}</Typography>
                <Grid container spacing={1}>
                  {otherImageUrls.map((url, index) => (
                    <Grid item xs={4} sm={3} key={index}>
                      <Card>
                        <CardMedia component="img" height="100" image={url} alt={`${name} ${index + 1}`} />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="h4" component="h1" gutterBottom>{name}</Typography>
            <List>
              <ListItem disablePadding><ListItemIcon><LocationCity color="primary"/></ListItemIcon><ListItemText primary={address} /></ListItem>
              <ListItem disablePadding><ListItemIcon><Place color="primary"/></ListItemIcon><ListItemText primary={location} /></ListItem>
              <ListItem disablePadding><ListItemIcon><Money color="primary"/></ListItemIcon><ListItemText primary={`₹${price} / ${t('night')}`} /></ListItem>
               {mapLocationUrl && (
                <ListItem disablePadding>
                    <ListItemIcon><Place color="primary"/></ListItemIcon>
                    <ListItemText 
                        primary={<Link href={mapLocationUrl} target="_blank" rel="noopener noreferrer">{t('view_on_map')}</Link>}
                    />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }}/>

            <Typography variant="h6">{t('description')}</Typography>
            <Typography paragraph>{details || t('no_details_provided')}</Typography>

            <Box sx={{ mt: 3 }}>
              {user ? (
                <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                  {t('book_now')}
                </Button>
              ) : (
                <Button component={RouterLink} to="/login" variant="contained" color="primary">
                  {t('login_to_book')}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
      >
        <DialogTitle>
          {t('book_guest_house_title')}
          <IconButton aria-label="close" onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <BookGuestHouse guestHouse={guestHouse} onSuccess={handleBookingSuccess} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default GuestHouseDetail;