import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Grid, Card, CardMedia, CardContent, Typography, Button, CardActions, TextField, Box, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const GuestHousesDisplay = () => {
  const [guestHouses, setGuestHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchGuestHouses = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'guesthouses'));
        const guestHousesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(gh => gh.location);
        setGuestHouses(guestHousesData);
      } catch (err) {
        console.error(t('error_fetching_guest_houses'), err);
        setError(t('error_fetching_guest_houses'));
      } finally {
        setLoading(false);
      }
    };

    fetchGuestHouses();
  }, [t]);

  const filteredGuestHouses = useMemo(() => {
    if (!searchTerm) {
      return guestHouses;
    }
    return guestHouses.filter(gh =>
      (gh.name && gh.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gh.address && gh.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gh.location && gh.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gh.details && gh.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, guestHouses]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TextField
          label={t('search_guest_houses')}
          variant="outlined"
          fullWidth
          sx={{ maxWidth: '600px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>
      <Grid container spacing={4}>
        {filteredGuestHouses.length > 0 ? filteredGuestHouses.map(guestHouse => (
          <Grid key={guestHouse.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardMedia
                component="img"
                height="140"
                image={guestHouse.mainImageUrl || t('placeholder_image_url')}
                alt={guestHouse.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {guestHouse.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {guestHouse.address}
                </Typography>
                <Typography variant="h6" color="text.primary" sx={{ mt: 2 }}>
                  {`₹${guestHouse.price} / ${t('night')}`}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to={`/guesthouse/${guestHouse.id}`}>{t('view')}</Button>
              </CardActions>
            </Card>
          </Grid>
        )) : (
          <Grid size={{ xs: 12 }}>
            <Typography align="center">{t('no_guest_houses_found')}</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default GuestHousesDisplay;