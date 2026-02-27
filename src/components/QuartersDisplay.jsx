import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
    Grid, Card, CardMedia, CardContent, Typography, Button, 
    CardActions, Snackbar, Alert, Box, CircularProgress, TextField, 
    Dialog, DialogTitle, DialogContent 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ApplyForQuarterForm from './ApplyForQuarterForm';

// No props passed to this component
const QuartersDisplay = () => {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openApplyForm, setOpenApplyForm] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
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
      } catch (error) {
        console.error(t('error_fetching_quarters'), error);
        setSnackbar({ open: true, message: t('error_fetching_quarters'), severity: 'error' });
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
      (q.quarterType && q.quarterType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, quarters]);


  const handleApplyClick = (quarter) => {
    setSelectedQuarter(quarter);
    setOpenApplyForm(true);
  };

  const handleCloseApplyForm = (success) => {
    setOpenApplyForm(false);
    setSelectedQuarter(null);
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

  return (
    <Box sx={{ p: 1 }}>
       <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TextField
          label={t('search_quarters')}
          variant="outlined"
          fullWidth
          sx={{ maxWidth: '600px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>
      <Grid container spacing={4}>
        {filteredQuarters.length > 0 ? filteredQuarters.map(quarter => (
          <Grid key={quarter.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardMedia
                component="img"
                height="140"
                image={quarter.mainImageUrl || t('placeholder_image_url')}
                alt={quarter.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {quarter.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {quarter.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('quarter_type')}: {quarter.quarterType}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleApplyClick(quarter)}>{t('apply')}</Button>
                <Button size="small" component={Link} to={`/quarter/${quarter.id}`}>{t('view_details')}</Button>
              </CardActions>
            </Card>
          </Grid>
        )) : (
          <Grid xs={12}>
            <Typography align="center">{t('no_available_quarters_found')}</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={openApplyForm} onClose={() => handleCloseApplyForm(null)}>
        <DialogTitle>{t('apply_for_quarter_title_with_name', { quarterName: selectedQuarter?.name })}</DialogTitle>
        <DialogContent>
            {selectedQuarter && (
                <ApplyForQuarterForm
                    quarter={selectedQuarter}
                    onSuccess={() => handleCloseApplyForm(true)}
                />
            )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuartersDisplay;