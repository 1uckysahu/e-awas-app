import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, where, runTransaction, getDocs, collection, query } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  CssBaseline,
  CircularProgress,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { AddCircleOutline, People, Email, LocationOn, Visibility, VisibilityOff, SupervisedUserCircle, AdminPanelSettings } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const adminDashboardTheme = createTheme({
  palette: {
    primary: {
      main: '#00796b', // Teal
      light: '#48a999',
      dark: '#004c40',
    },
    background: {
      default: '#f5f5f5'
    },
    grey: {
        50: '#fafafa',
        100: '#f5f5f5'
    }
  },
  shadows: [
    'none',
    '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.02)',
    '0px 3px 5px -1px rgba(0,0,0,0.06), 0px 5px 8px 0px rgba(0,0,0,0.04), 0px 1px 14px 0px rgba(0,0,0,0.02)',
    '0px 4px 8px -1px rgba(0,0,0,0.07), 0px 8px 12px 0px rgba(0,0,0,0.05), 0px 1px 18px 0px rgba(0,0,0,0.03)',
    ...Array(21).fill('none') // Keep other shadows as none if not used
  ],
  typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
          fontWeight: 700,
      },
      h5: {
          fontWeight: 600,
      }
  }
});

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [officerType, setOfficerType] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formLoading, setFormLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // State for fetching and storing officers
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [officersError, setOfficersError] = useState(null);

  // Fetch officers once on component mount
  useEffect(() => {
    const fetchOfficers = async () => {
      setOfficersLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("officerType", "in", ["Quarter Officer", "Guest House Officer"]));
        const querySnapshot = await getDocs(q);
        const fetchedOfficers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOfficers(fetchedOfficers);
        setOfficersError(null);
      } catch (err) {
        console.error("Error fetching officers:", err);
        setOfficersError(t('error_fetching_users'));
      } finally {
        setOfficersLoading(false);
      }
    };

    fetchOfficers();
  }, [t]);


  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!officerType || !fullName || !email || !password || !location) {
        setSnackbar({ open: true, message: t('all_fields_are_required'), severity: 'error' });
        setFormLoading(false);
      return;
    }

    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const officerId = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "officerCounter");
        const counterDoc = await transaction.get(counterRef);

        const newCount = (counterDoc.data()?.count || 0) + 1;
        const newOfficerId = `OID-${String(newCount).padStart(5, '0')}`;

        const userDocRef = doc(db, "users", user.uid);
        transaction.set(userDocRef, {
            officerId: newOfficerId,
            fullName,
            email,
            officerType,
            location,
            createdAt: new Date().toISOString(),
        });

        transaction.set(counterRef, { count: newCount }, { merge: true });

        return newOfficerId;
      });

      setSnackbar({ open: true, message: t('officer_created_successfully', { officerId }), severity: 'success' });
      
      // Add the new officer to the local state to update the UI
      setOfficers(prev => [...prev, { officerId, fullName, email, officerType, location, id: user.uid }]);
      
      // Clear form
      setOfficerType('');
      setFullName('');
      setEmail('');
      setPassword('');
      setLocation('');
      setShowPassword(false);
    } catch (error) {
      if (userCredential) {
        await deleteUser(userCredential.user);
      }
      console.error("Error creating officer:", error);
      setSnackbar({ open: true, message: t('error_creating_officer'), severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (officersLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  if (officersError) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <Typography color="error">{officersError}</Typography>
          </Box>
      )
  }
  
  const quarterOfficers = officers.filter(o => o.officerType === 'Quarter Officer');
  const guestHouseOfficers = officers.filter(o => o.officerType === 'Guest House Officer');

  return (
    <ThemeProvider theme={adminDashboardTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <AdminPanelSettings color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" component="h1">
                {t('admin_control_panel')}
            </Typography>
        </Box>
        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 4, borderRadius: '16px', boxShadow: adminDashboardTheme.shadows[3] }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <AddCircleOutline color="primary" sx={{ fontSize: 32, mr: 1.5 }}/>
                        <Typography variant="h5" component="h2">
                            {t('create_officer')}
                        </Typography>
                    </Box>
                    <Box component="form" onSubmit={handleCreateOfficer}>
                        <FormControl fullWidth margin="normal" variant="outlined">
                            <InputLabel>{t('officer_type')}</InputLabel>
                            <Select
                                value={officerType}
                                onChange={(e) => setOfficerType(e.target.value)}
                                label={t('officer_type')}
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="Quarter Officer">{t('quarter_officer')}</MenuItem>
                                <MenuItem value="Guest House Officer">{t('guest_house_officer')}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth margin="normal" label={t('full_name')} value={fullName} onChange={(e) => setFullName(e.target.value)} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <TextField fullWidth margin="normal" label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <TextField 
                            fullWidth 
                            margin="normal" 
                            label={t('temporary_password')} 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            InputProps={{
                                endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={t('toggle_password_visibility')}
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                                )
                            }}
                        />
                        <TextField fullWidth margin="normal" label={t('location')} value={location} onChange={(e) => setLocation(e.target.value)} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <Button 
                            type="submit" 
                            fullWidth 
                            variant="contained" 
                            sx={{ 
                                mt: 2, 
                                p: 1.5, 
                                fontWeight: 'bold', 
                                borderRadius: '8px', 
                                boxShadow: '0px 4px 15px rgba(0, 121, 107, 0.3)',
                                '&:hover': {
                                    boxShadow: '0px 6px 20px rgba(0, 121, 107,.4)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                            disabled={formLoading}
                        >
                            {formLoading ? <CircularProgress size={24} color="inherit" /> : t('create_user')}
                        </Button>
                    </Box>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
                <Paper sx={{ p: 3, borderRadius: '16px', height: '100%', boxShadow: adminDashboardTheme.shadows[3] }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SupervisedUserCircle color="primary" sx={{ fontSize: 32, mr: 1.5 }}/>
                        <Typography variant="h5" component="h3">
                            {t('all_users')}
                        </Typography>
                    </Box>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label={t('officer_types')} indicatorColor="primary" textColor="primary">
                            <Tab label={t('quarter_officers')} />
                            <Tab label={t('guest_house_officers')} />
                        </Tabs>
                    </Box>
                    <TabPanel value={tabValue} index={0}>
                        <OfficerTable officers={quarterOfficers} />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <OfficerTable officers={guestHouseOfficers} />
                    </TabPanel>
                </Paper>
            </Grid>
        </Grid>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const OfficerTable = ({ officers }) => {
  const { t } = useTranslation();
  return (
    <TableContainer sx={{ maxHeight: 440 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={{ '& .MuiTableCell-root': { backgroundColor: adminDashboardTheme.palette.grey[100], fontWeight: 'bold' } }}>
            <TableCell><People sx={{mr:1, verticalAlign: 'middle'}}/>{t('officer_id')}</TableCell>
            <TableCell><People sx={{mr:1, verticalAlign: 'middle'}}/>{t('full_name')}</TableCell>
            <TableCell><Email sx={{mr:1, verticalAlign: 'middle'}}/>{t('email')}</TableCell>
            <TableCell><LocationOn sx={{mr:1, verticalAlign: 'middle'}}/>{t('location')}</TableCell>
            <TableCell><People sx={{mr:1, verticalAlign: 'middle'}}/>{t('role')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {officers && officers.map((officer) => (
            <TableRow hover key={officer.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>{officer.officerId}</TableCell>
              <TableCell>{officer.fullName}</TableCell>
              <TableCell>{officer.email}</TableCell>
              <TableCell>{officer.location}</TableCell>
              <TableCell>{t(officer.officerType.replace(/ /g, '_').toLowerCase())}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

OfficerTable.propTypes = {
  officers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      officerId: PropTypes.string,
      fullName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      officerType: PropTypes.string.isRequired,
    })
  ),
};

export default AdminDashboard;
