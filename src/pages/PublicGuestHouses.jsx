import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
    Grid, 
    Card, 
    CardMedia, 
    CardContent, 
    Typography, 
    Button, 
    CardActions, 
    TextField, 
    Box, 
    CircularProgress, 
    Alert, 
    Container, 
    InputAdornment 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const PublicGuestHouses = () => {
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
        console.error("Error fetching guest houses:", err);
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={60} /></Box>;
  }

  if (error) {
    return <Container maxWidth="lg" sx={{ my: 5 }}><Alert severity="error" sx={{ p: 3, fontSize: '1.1rem' }}>{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ my: 5 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50' }}>
            {t('explore_guest_houses')}
        </Typography>
        <TextField
          label={t('search_guest_houses')}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            maxWidth: '700px',
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredGuestHouses.length > 0 ? (
        <Grid container spacing={4}>
          {filteredGuestHouses.map(guestHouse => (
            <Grid key={guestHouse.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: '16px',
                transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: 3,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={guestHouse.mainImageUrl || t('placeholder_image_url')}
                  alt={guestHouse.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: '600', color: '#34495e' }}>
                    {guestHouse.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1.5, mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2">{guestHouse.address}</Typography>
                  </Box>
                  <Typography variant="h6" color="primary" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {`₹${guestHouse.price || 0} / ${t('night')}`}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    component={Link} 
                    to={`/guesthouse/${guestHouse.id}`}
                    sx={{ 
                        borderRadius: '50px', 
                        fontWeight: 'bold', 
                        boxShadow: 'none',
                        py: 1.2
                    }}
                  >
                    {t('view')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" mt={10}>
          <Typography variant="h6" color="text.secondary">{t('no_guest_houses_found')}</Typography>
        </Box>
      )}
    </Container>
  );
};

export default PublicGuestHouses;
