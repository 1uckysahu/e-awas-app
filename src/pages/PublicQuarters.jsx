import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
import HomeIcon from '@mui/icons-material/Home';

const PublicQuarters = () => {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchQuarters = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'quarters'), where('available', '==', true));
        const querySnapshot = await getDocs(q);
        const quartersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuarters(quartersData);
      } catch (err) {
        console.error("Error fetching quarters:", err);
        setError(t('error_fetching_quarters'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuarters();
  }, [t]);

  const filteredQuarters = useMemo(() => {
    if (!searchTerm) {
      return quarters;
    }
    return quarters.filter(q =>
      (q.name && q.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.address && q.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.location && q.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.type && q.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, quarters]);

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
            {t('browse_quarters')}
        </Typography>
        <TextField
          label={t('search_quarters')}
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
      
      {filteredQuarters.length > 0 ? (
        <Grid container spacing={4}>
          {filteredQuarters.map(quarter => (
            <Grid key={quarter.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                  image={quarter.mainImageUrl || t('placeholder_image_url')}
                  alt={quarter.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: '600', color: '#34495e' }}>
                    {quarter.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1.5, mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2">{quarter.location}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <HomeIcon sx={{ fontSize: 18, mr: 1 }} />
                      <Typography variant="body2">{quarter.type}</Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    component={Link} 
                    to={`/quarter/${quarter.id}`}
                    sx={{ 
                        borderRadius: '50px', 
                        fontWeight: 'bold', 
                        boxShadow: 'none',
                        py: 1.2
                    }}
                  >
                    {t('view_details')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" mt={10}>
          <Typography variant="h6" color="text.secondary">{t('no_available_quarters_found')}</Typography>
        </Box>
      )}
    </Container>
  );
};

export default PublicQuarters;
