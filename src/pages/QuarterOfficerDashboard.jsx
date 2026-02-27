import { useState } from 'react';
import PropTypes from 'prop-types';
import { auth } from '../firebase';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Add as AddIcon, List as ListIcon, Assignment as AssignmentIcon, LocationOn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import MyQuarters from '../components/MyQuarters';
import AddQuarterForm from '../components/AddQuarterForm';
import QuarterApplications from '../components/QuarterApplications';
import officerTheme from '../theme/officerTheme';
import { ThemeProvider } from '@mui/material/styles';
import useDocument from '../hooks/useDocument';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};

const QuarterOfficerDashboard = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [editingQuarter, setEditingQuarter] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: officer, loading, error } = useDocument('users', auth.currentUser?.uid);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleQuarterAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setValue(0); // Switch to the 'My Quarters' tab
    setFeedback({ open: true, message: t('quarter_added_successfully'), severity: 'success' });
  };

  const handleQuarterUpdated = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setIsEditDialogOpen(false);
    setEditingQuarter(null);
    setFeedback({ open: true, message: t('quarter_updated_successfully'), severity: 'success' });
  };

  const handleQuarterDeleted = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setFeedback({ open: true, message: t('quarter_deleted_successfully'), severity: 'success' });
  }

  const handleEdit = (quarter) => {
    setEditingQuarter(quarter);
    setIsEditDialogOpen(true);
  }

  const handleCloseEditDialog = () => {
      setIsEditDialogOpen(false);
      setEditingQuarter(null);
  }

  if (loading) {
    return <CircularProgress />;
  }
  
  if (error) {
    return <Alert severity="error">{error.message}</Alert>
  }

  const officerLocation = officer?.location;

  return (
    <ThemeProvider theme={officerTheme}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
            <Paper 
                elevation={6} 
                sx={{
                    p: 4, 
                    mb: 4, 
                    borderRadius: 3, 
                    background: 'linear-gradient(90deg, rgba(33,150,243,1) 0%, rgba(103,58,183,1) 100%)',
                    color: 'white'
                }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                    {officer?.photoUrl && (
                        <Avatar 
                            src={officer.photoUrl} 
                            sx={{
                                width: 90, 
                                height: 90, 
                                border: '3px solid white',
                                boxShadow: '0px 4px 12px rgba(0,0,0,0.2)'
                            }}
                        />
                    )}
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                            {t('quarter_officer_dashboard')}
                        </Typography>
                        <Typography variant="h5" sx={{ my: 1 }}>
                            {t('welcome_to_dashboard', { name: officer?.fullName || '' })}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                            <LocationOn />
                            <Typography variant="subtitle1">
                                {officerLocation ? officerLocation : t('location_not_assigned')}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
          
          {
            !officerLocation ? (
                <Alert severity="error">{t('location_not_assigned_error')}</Alert>
              ) : (
                <Paper sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <Tabs 
                    value={value} 
                    onChange={handleChange} 
                    centered 
                    indicatorColor="primary" 
                    textColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab icon={<ListIcon />} iconPosition="start" label={t('my_quarters')} />
                    <Tab icon={<AddIcon />} iconPosition="start" label={t('add_new_quarter')} />
                    <Tab icon={<AssignmentIcon />} iconPosition="start" label={t('applications')} />
                  </Tabs>
                  <TabPanel value={value} index={0}>
                    <MyQuarters onEdit={handleEdit} refreshKey={refreshKey} officerLocation={officerLocation} onQuarterDeleted={handleQuarterDeleted} />
                  </TabPanel>
                  <TabPanel value={value} index={1}>
                    <AddQuarterForm onFormSubmit={handleQuarterAdded} officerLocation={officerLocation} />
                  </TabPanel>
                  <TabPanel value={value} index={2}>
                    <QuarterApplications officerLocation={officerLocation} />
                  </TabPanel>
                </Paper>
              )
          }
        </Box>
        <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
            <DialogTitle>{t('edit_quarter')}</DialogTitle>
            <DialogContent>
                <AddQuarterForm
                    onFormSubmit={handleQuarterUpdated}
                    officerLocation={officerLocation}
                    quarterToEdit={editingQuarter}
                />
            </DialogContent>
        </Dialog>
        <Snackbar 
            open={feedback.open} 
            autoHideDuration={6000} 
            onClose={() => setFeedback(prev => ({...prev, open: false}))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setFeedback(prev => ({...prev, open: false}))} severity={feedback.severity} sx={{ width: '100%' }}>
                {feedback.message}
            </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default QuarterOfficerDashboard;
