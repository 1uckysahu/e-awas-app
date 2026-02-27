import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Typography, Container, Box, ThemeProvider, Tabs, Tab, Paper, TextField, Button,
    InputAdornment, IconButton, Grid, Card, CardMedia, CardContent, CardActions,
    Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
    Avatar, Stack, Divider, Checkbox, FormControlLabel
} from '@mui/material';
import {
    Add, List, LocationOn, Image, AddPhotoAlternate, Delete, Edit, Assignment,
    CalendarMonth, Map, Public, Payments
} from '@mui/icons-material';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import officerTheme from '../theme/officerTheme';
import { useTranslation } from 'react-i18next';
import BookingRequests from '../components/BookingRequests';
import Availability from './Availability'; // Import the new Availability component
import MapView from '../components/MapView';
import PaymentHistory from '../components/PaymentHistory';
import DOMPurify from 'dompurify';

const AddGuestHouseForm = ({ onGuestHouseAdded, officerLocation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
      name: '',
      details: '',
      address: '',
      price: '',
      mainImageUrl: '',
      otherImageUrls: [''],
      mapLocationUrl: '',
      available: true,
      latitude: '',
      longitude: ''
  });
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOtherImageChange = (index, value) => {
    const newImages = [...formData.otherImageUrls];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, otherImageUrls: newImages }));
  };

  const handleAddImageField = () => {
    setFormData(prev => ({ ...prev, otherImageUrls: [...prev.otherImageUrls, ''] }));
  };

  const handleRemoveImageField = (index) => {
    const newImages = formData.otherImageUrls.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, otherImageUrls: newImages }));
  };

  const validateAndSanitize = (data) => {
    const sanitizedData = {};
    for (const key in data) {
      if (typeof data[key] === 'string') {
        sanitizedData[key] = DOMPurify.sanitize(data[key]);
      } else {
        sanitizedData[key] = data[key];
      }
    }

    if (isNaN(Number(sanitizedData.price)) || Number(sanitizedData.price) <= 0) {
      throw new Error(t('price_must_be_positive', 'Price must be a positive number.'));
    }

    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(sanitizedData.mainImageUrl)) {
      throw new Error(t('invalid_main_image_url', 'Invalid Main Image URL.'));
    }

    if (sanitizedData.mapLocationUrl && !urlRegex.test(sanitizedData.mapLocationUrl)) {
        throw new Error(t('invalid_map_location_url', 'Invalid Map Location URL.'));
    }
    
    sanitizedData.otherImageUrls.forEach((url, index) => {
        if (url && !urlRegex.test(url)) {
            throw new Error(t('invalid_other_image_url', 'Invalid Other Image URL at index {{index}}', {index: index + 1}));
        }
    });

    const lat = Number(sanitizedData.latitude);
    const lon = Number(sanitizedData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error(t('invalid_latitude', 'Latitude must be between -90 and 90.'));
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
        throw new Error(t('invalid_longitude', 'Longitude must be between -180 and 180.'));
    }

    return sanitizedData;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setFeedback({ open: true, message: t('you_must_be_logged_in'), severity: 'error' });
      return;
    }
    if(!officerLocation){
        setFeedback({ open: true, message: t('officer_location_not_set'), severity: 'error' });
        return;
    }

    try {
        const sanitizedData = validateAndSanitize(formData);
        await addDoc(collection(db, 'guesthouses'), {
            ...sanitizedData,
            price: Number(sanitizedData.price),
            latitude: Number(sanitizedData.latitude),
            longitude: Number(sanitizedData.longitude),
            location: officerLocation,
            otherImageUrls: sanitizedData.otherImageUrls.filter(url => url),
            officerId: user.uid
        });
        setFormData({ name: '', details: '', address: '', price: '', mainImageUrl: '', otherImageUrls: [''], mapLocationUrl: '', available: true, latitude: '', longitude: '' });
        setFeedback({ open: true, message: t('guest_house_added_successfully'), severity: 'success' });
        onGuestHouseAdded();
    } catch (error) {
      console.error("Error adding document: ", error);
      setFeedback({ open: true, message: error.message || t('failed_to_add_guest_house'), severity: 'error' });
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: '12px' }}>
      <Typography variant="h5" gutterBottom>{t('add_new_guest_house')}</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth name="name" label={t('guest_house_name')} value={formData.name} onChange={handleChange} required /></Grid>
           <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth name="price" label={t('price_per_night')} type="number" value={formData.price} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} required /></Grid>
           <Grid size={{ xs: 12 }}><TextField fullWidth name="address" label={t('full_address')} value={formData.address} onChange={handleChange} required /></Grid>
           <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth name="latitude" label={t('latitude')} type="number" value={formData.latitude} onChange={handleChange} required /></Grid>
           <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth name="longitude" label={t('longitude')} type="number" value={formData.longitude} onChange={handleChange} required /></Grid>
           <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t('location')} value={officerLocation} InputProps={{ readOnly: true, startAdornment: <LocationOn /> }} variant="filled" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth name="mapLocationUrl" label={t('map_location_url')} value={formData.mapLocationUrl} onChange={handleChange} InputProps={{ startAdornment: <Map /> }} />
            </Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={3} name="details" label={t('details_description')} value={formData.details} onChange={handleChange} /></Grid>
            
            <Grid size={{ xs: 12 }}><Divider sx={{ my: 2 }} /></Grid>

            <Grid size={{ xs: 12 }}><TextField fullWidth name="mainImageUrl" label={t('main_display_image_url')} value={formData.mainImageUrl} onChange={handleChange} InputProps={{ startAdornment: <Image /> }} required /></Grid>
            <Grid size={{ xs: 12 }}>
                <Typography variant="h6">{t('other_images_links')}</Typography>
                {formData.otherImageUrls.map((image, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField fullWidth label={t('image_url', { index: index + 1 })} value={image} onChange={(e) => handleOtherImageChange(index, e.target.value)} InputProps={{ startAdornment: <AddPhotoAlternate /> }} />
                        <IconButton onClick={() => handleRemoveImageField(index)}><Delete /></IconButton>
                    </Box>
                ))}
                <Button startIcon={<Add />} onClick={handleAddImageField}>{t('add_more_images')}</Button>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <FormControlLabel
                    control={<Checkbox checked={formData.available} onChange={handleChange} name="available" />}
                    label={t('available_for_booking')}
                />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" size="large" startIcon={<Add />} disabled={!officerLocation}>{t('add_guest_house')}</Button>
        </Box>
      </form>
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({ ...feedback, open: false })}>
        <Alert severity={feedback.severity} sx={{ width: '100%' }}>{feedback.message}</Alert>
      </Snackbar>
    </Paper>
  );
};

AddGuestHouseForm.propTypes = {
    onGuestHouseAdded: PropTypes.func.isRequired,
    officerLocation: PropTypes.string.isRequired,
};

const GuestHouseForm = ({ guestHouse, onUpdated, onClose, officerLocation }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: guestHouse?.name || '',
        details: guestHouse?.details || '',
        address: guestHouse?.address || '',
        price: guestHouse?.price || '',
        mapLocationUrl: guestHouse?.mapLocationUrl || '',
        mainImageUrl: guestHouse?.mainImageUrl || '',
        otherImageUrls: guestHouse?.otherImageUrls && guestHouse.otherImageUrls.length > 0 ? guestHouse.otherImageUrls : [''],
        available: guestHouse?.available !== undefined ? guestHouse.available : true,
        latitude: guestHouse?.latitude || '',
        longitude: guestHouse?.longitude || ''
    });
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleOtherImageChange = (index, value) => {
        const newImages = [...(formData.otherImageUrls)];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, otherImageUrls: newImages }));
    };

    const handleAddImageField = () => {
        setFormData(prev => ({ ...prev, otherImageUrls: [...prev.otherImageUrls, ''] }));
    };

    const handleRemoveImageField = (index) => {
        const newImages = formData.otherImageUrls.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, otherImageUrls: newImages }));
    };

    const validateAndSanitize = (data) => {
        const sanitizedData = {};
        for (const key in data) {
        if (typeof data[key] === 'string') {
            sanitizedData[key] = DOMPurify.sanitize(data[key]);
        } else {
            sanitizedData[key] = data[key];
        }
        }

        if (isNaN(Number(sanitizedData.price)) || Number(sanitizedData.price) <= 0) {
            throw new Error(t('price_must_be_positive', 'Price must be a positive number.'));
        }

        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
        if (!urlRegex.test(sanitizedData.mainImageUrl)) {
            throw new Error(t('invalid_main_image_url', 'Invalid Main Image URL.'));
        }
        
        if (sanitizedData.mapLocationUrl && !urlRegex.test(sanitizedData.mapLocationUrl)) {
            throw new Error(t('invalid_map_location_url', 'Invalid Map Location URL.'));
        }

        sanitizedData.otherImageUrls.forEach((url, index) => {
            if (url && !urlRegex.test(url)) {
                throw new Error(t('invalid_other_image_url', 'Invalid Other Image URL at index {{index}}', {index: index + 1}));
            }
        });

        const lat = Number(sanitizedData.latitude);
        const lon = Number(sanitizedData.longitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new Error(t('invalid_latitude', 'Latitude must be between -90 and 90.'));
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
            throw new Error(t('invalid_longitude', 'Longitude must be between -180 and 180.'));
        }

        return sanitizedData;
    }

    const handleSubmit = async () => {
        if (!guestHouse?.id) return;
        
        try {
            const sanitizedData = validateAndSanitize(formData);
            const docRef = doc(db, 'guesthouses', guestHouse.id);
            const dataToUpdate = { 
                ...sanitizedData, 
                price: Number(sanitizedData.price), 
                latitude: Number(sanitizedData.latitude),
                longitude: Number(sanitizedData.longitude),
                location: officerLocation, 
                otherImageUrls: sanitizedData.otherImageUrls.filter(url => url) 
            };
            await updateDoc(docRef, dataToUpdate);
            setFeedback({ open: true, message: t('guest_house_updated_successfully'), severity: 'success' });
            onUpdated();
            onClose();
        } catch (error) {
            console.error("Error updating document: ", error);
            setFeedback({ open: true, message: error.message || t('failed_to_update_guest_house'), severity: 'error' });
        }
    };

    return (
        <>
            <DialogTitle>{t('edit_guest_house')}</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('guest_house_name')} name="name" value={formData.name || ''} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('price_per_night')} name="price" type="number" value={formData.price || ''} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
                    <Grid size={{ xs: 12 }}><TextField fullWidth label={t('full_address')} name="address" value={formData.address || ''} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth name="latitude" label={t('latitude')} type="number" value={formData.latitude} onChange={handleChange} required /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth name="longitude" label={t('longitude')} type="number" value={formData.longitude} onChange={handleChange} required /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label={t('location')} name="location" value={officerLocation || ''} InputProps={{ readOnly: true, startAdornment: <LocationOn /> }} variant="filled" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                         <TextField fullWidth name="mapLocationUrl" label={t('map_location_url')} value={formData.mapLocationUrl || ''} onChange={handleChange} InputProps={{ startAdornment: <Map /> }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}><TextField fullWidth label={t('details_description')} name="details" multiline rows={3} value={formData.details || ''} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12 }}><Divider sx={{ my: 2 }}/></Grid>
                    <Grid size={{ xs: 12 }}><TextField fullWidth label={t('main_display_image_url')} name="mainImageUrl" value={formData.mainImageUrl || ''} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6">{t('other_images_links')}</Typography>
                        {formData.otherImageUrls.map((image, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TextField fullWidth label={t('image_url', { index: index + 1})} value={image} onChange={(e) => handleOtherImageChange(index, e.target.value)} InputProps={{ startAdornment: <AddPhotoAlternate /> }} />
                                <IconButton onClick={() => handleRemoveImageField(index)}><Delete /></IconButton>
                            </Box>
                        ))}
                        <Button startIcon={<Add/>} onClick={handleAddImageField}>{t('add_more_images')}</Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={<Checkbox checked={formData.available} onChange={handleChange} name="available" />}
                            label={t('available_for_booking')}
                         />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSubmit} variant="contained">{t('save_changes')}</Button>
            </DialogActions>
            <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({ ...feedback, open: false })}>
                <Alert severity={feedback.severity} sx={{ width: '100%' }}>{feedback.message}</Alert>
            </Snackbar>
        </>
    );
};

GuestHouseForm.propTypes = {
    guestHouse: PropTypes.object,
    onUpdated: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    officerLocation: PropTypes.string.isRequired,
};

const EditGuestHouseDialog = ({ open, onClose, guestHouse, onUpdated, officerLocation }) => {
    if(!open) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <GuestHouseForm 
                key={guestHouse ? guestHouse.id : 'new'}
                guestHouse={guestHouse}
                onUpdated={onUpdated}
                onClose={onClose}
                officerLocation={officerLocation}
            />
        </Dialog>
    );
};

EditGuestHouseDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    guestHouse: PropTypes.object,
    onUpdated: PropTypes.func.isRequired,
    officerLocation: PropTypes.string.isRequired,
};

const MyGuestHouses = ({ refreshKey, onEditClick, officerLocation, onGuestHouseDeleted }) => {
    const { t } = useTranslation();
    const [guestHouses, setGuestHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, houseId: null, houseName: '' });

    const fetchGuestHouses = useCallback(async () => {
        if (!officerLocation) {
            setGuestHouses([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const q = query(collection(db, 'guesthouses'), where('location', '==', officerLocation));
            const querySnapshot = await getDocs(q);
            const houses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGuestHouses(houses);
        } catch (error) {
            console.error("Error fetching guesthouses: ", error);
            setGuestHouses([]);
        } finally {
            setLoading(false);
        }
    }, [officerLocation]);

    useEffect(() => {
        if(officerLocation){
            fetchGuestHouses();
        }
    }, [refreshKey, officerLocation, fetchGuestHouses]);

    const handleDeleteClick = (houseId, houseName) => {
        setDeleteConfirmation({ open: true, houseId, houseName });
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmation.houseId) {
            try {
                await deleteDoc(doc(db, 'guesthouses', deleteConfirmation.houseId));
                onGuestHouseDeleted(); 
            } catch (error) {
                console.error("Error deleting guest house: ", error);
            }
            setDeleteConfirmation({ open: false, houseId: null, houseName: '' });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmation({ open: false, houseId: null, houseName: '' });
    };

    if (loading) return <CircularProgress />;
    
    if (guestHouses.length === 0) {
        return <Typography>{t('no_guest_houses_found_in_your_location')}</Typography>;
    }

    return (
        <>
            <Grid container spacing={4}>
                {guestHouses.map(house => (
                    <Grid key={house.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card>
                            <CardMedia component="img" height="140" image={house.mainImageUrl || 'https://via.placeholder.com/300'} alt={house.name} />
                            <CardContent>
                                <Typography gutterBottom variant="h5">{house.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{house.address}</Typography>
                                <Typography variant="body2" color="text.secondary">{t('location')}: {house.location}</Typography>
                                <Typography variant="h6" color="text.primary" sx={{ mt: 1 }}>{`₹${house.price} / ${t('night')}`}</Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" startIcon={<Edit />} onClick={() => onEditClick(house)}>{t('edit')}</Button>
                                <Button size="small" startIcon={<Delete />} onClick={() => handleDeleteClick(house.id, house.name)}>{t('delete')}</Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Dialog open={deleteConfirmation.open} onClose={handleDeleteCancel}>
                <DialogTitle>{t('confirm_delete_title')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('confirm_delete_message', { houseName: deleteConfirmation.houseName })}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>{t('cancel')}</Button>
                    <Button onClick={handleDeleteConfirm} color="error">{t('delete')}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

MyGuestHouses.propTypes = {
    refreshKey: PropTypes.number.isRequired,
    onEditClick: PropTypes.func.isRequired,
    officerLocation: PropTypes.string.isRequired,
    onGuestHouseDeleted: PropTypes.func.isRequired,
};


const GuestHouseDashboard = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentGuestHouse, setCurrentGuestHouse] = useState(null);
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setOfficer({ ...user, ...userData });
                    if (!userData.location) {
                        setError(t('officer_location_not_set'));
                    }
                } else {
                    setError(t('user_data_not_found'));
                }
            } catch (err) {
                console.error("Error fetching officer data:", err);
                setError(t('error_fetching_user_data'));
            } finally {
                setLoading(false);
            }
        } else {
            setOfficer(null);
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, [t]);

  const handleChange = (event, newValue) => setValue(newValue);
  
  const handleGuestHouseAdded = () => {
    setRefreshKey(oldKey => oldKey + 1);
    setValue(0);
  };

  const handleGuestHouseDeleted = () => {
      setRefreshKey(oldKey => oldKey + 1);
      setFeedback({ open: true, message: t('guest_house_deleted_successfully'), severity: 'success' });
  };

  const handleEditClick = (guestHouse) => {
      setCurrentGuestHouse(guestHouse);
      setEditDialogOpen(true);
  };

  const handleEditClose = () => {
      setEditDialogOpen(false);
      setCurrentGuestHouse(null);
  };

  const handleGuestHouseUpdated = () => {
      setRefreshKey(oldKey => oldKey + 1);
  };
  
  if (loading) {
      return <Container sx={{display: 'flex', justifyContent: 'center', mt: 5}}><CircularProgress /></Container>;
  }

  const officerLocation = officer?.location;
  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
  };

  TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
  };

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
                            {t('guest_house_dashboard_title')}
                        </Typography>
                        <Typography variant="h5" sx={{ my: 1 }}>
                            {t('welcome_to_dashboard', { name: officer?.fullName || '' })}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                            <LocationOn />
                            <Typography variant="subtitle1">
                                {officerLocation ? officerLocation : (error || t('loading'))}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

          {error && !officerLocation ? (
              <Alert severity="error">{error}</Alert>
          ) : (
            <Paper sx={{ borderRadius: 3, boxShadow: 3 }}>
              <Tabs 
                value={value} 
                onChange={handleChange} 
                variant="scrollable" 
                scrollButtons="auto" 
                aria-label="guest house dashboard tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label={t('my_guest_houses')} icon={<List />} iconPosition="start" />
                <Tab label={t('add_guest_house')} icon={<Add />} iconPosition="start" />
                <Tab label={t('booking_requests')} icon={<Assignment />} iconPosition="start" />
                <Tab label={t('availability')} icon={<CalendarMonth />} iconPosition="start" />
                <Tab label={t('map_view')} icon={<Public />} iconPosition="start" />
                <Tab label={t('payment_history')} icon={<Payments />} iconPosition="start" />
              </Tabs>
              <TabPanel value={value} index={0}>
                 <MyGuestHouses 
                    refreshKey={refreshKey} 
                    onEditClick={handleEditClick} 
                    officerLocation={officerLocation} 
                    onGuestHouseDeleted={handleGuestHouseDeleted}
                 />
              </TabPanel>
              <TabPanel value={value} index={1}>
                <AddGuestHouseForm onGuestHouseAdded={handleGuestHouseAdded} officerLocation={officerLocation} />
              </TabPanel>
              <TabPanel value={value} index={2}>
                <BookingRequests />
              </TabPanel>
              <TabPanel value={value} index={3}>
                <Availability officer={officer} />
              </TabPanel>
              <TabPanel value={value} index={4}>
                <MapView officer={officer} />
              </TabPanel>
               <TabPanel value={value} index={5}>
                <PaymentHistory officer={officer} />
              </TabPanel>
            </Paper>
          )}
        </Box>
        {currentGuestHouse && 
            <EditGuestHouseDialog 
                open={editDialogOpen} 
                onClose={handleEditClose} 
                guestHouse={currentGuestHouse} 
                onUpdated={handleGuestHouseUpdated} 
                officerLocation={officerLocation}
            />
        }
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

export default GuestHouseDashboard;
