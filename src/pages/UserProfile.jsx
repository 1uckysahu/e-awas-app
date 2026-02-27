
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { PhotoCamera, Edit, Save, Cancel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const UserProfile = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', photoUrl: '' });
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const dbData = userDocSnap.data();
          setUserData(dbData);
          setFormData({ 
            fullName: currentUser.displayName || dbData.fullName || '',
            phone: dbData.phone || '',
            photoUrl: currentUser.photoURL || dbData.photoUrl || '' 
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
        // Reset form data to original state when cancelling
        setFormData({ 
            fullName: user.displayName || userData.fullName || '',
            phone: userData.phone || '',
            photoUrl: user.photoURL || userData.photoUrl || '' 
        });
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { 
        displayName: formData.fullName,
        photoURL: formData.photoUrl,
      });

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName: formData.fullName,
        phone: formData.phone,
        photoUrl: formData.photoUrl
      });
      
      // Manually update local state to reflect changes immediately
      setUser({...auth.currentUser});
      setUserData(prev => ({...prev, ...formData}));

      setFeedback({ open: true, message: t('profile_updated_successfully'), severity: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setFeedback({ open: true, message: t('error_updating_profile'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress />;</Box>;
  }

  if (!user) {
    return <Container><Alert severity="warning">{t('please_log_in')}</Alert></Container>;
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ my: 4, p: 4, position: 'relative' }}>
        <Typography variant="h4" gutterBottom>{t('user_profile')}</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
            <Avatar
              src={formData.photoUrl}
              sx={{ width: 120, height: 120, margin: 'auto', mb: 2, border: '3px solid lightgray' }}
            />
            {isEditing && (
              <Button component="label" variant="outlined" startIcon={<PhotoCamera />}>
                {t('change_picture')}
                <input type="text" name="photoUrl" value={formData.photoUrl} onChange={handleChange} hidden/>
              </Button>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('full_name')}
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              variant={isEditing ? "outlined" : "filled"}
            />
          </Grid>
           <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('email')}
              name="email"
              value={user.email || ''}
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('phone_number')}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              variant={isEditing ? "outlined" : "filled"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('user_role')}
              value={userData?.role || t('general_user')}
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>
           {isEditing && (
            <Grid size={{ xs: 12 }} sx={{ textAlign: 'right', mt: 3 }}>
                <Button startIcon={<Cancel />} onClick={handleEditToggle} sx={{ mr: 1 }}>{t('cancel')}</Button>
                <Button variant="contained" startIcon={loading ? <CircularProgress size={20}/> : <Save />} onClick={handleUpdateProfile} disabled={loading}>{t('save_changes')}</Button>
            </Grid>
            )}
        </Grid>
        {!isEditing && (
            <Button 
                variant="contained" 
                startIcon={<Edit />} 
                onClick={handleEditToggle} 
                sx={{ position: 'absolute', top: 20, right: 20 }}>
                {t('edit_profile')}
            </Button>
        )}
      </Paper>
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserProfile;