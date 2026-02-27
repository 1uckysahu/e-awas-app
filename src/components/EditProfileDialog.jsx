import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, InputAdornment, CircularProgress, Snackbar, Alert, Box, Avatar } from '@mui/material';
import { Visibility, VisibilityOff, CloudUpload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, updatePassword } from 'firebase/auth';
import { db } from '../firebase';
import { uploadFile } from '../cloudinary';

const EditProfileDialog = ({ open, onClose, user, userData, onProfileUpdate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [newPhoto, setNewPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (open) {
        if (userData) {
            setFormData({
                phone: userData.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
            setPreviewUrl(userData.photoUrl || '');
        }
        setNewPhoto(null); // Reset file on open
    }
  }, [open, userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setFeedback({ open: true, message: t('passwords_do_not_match'), severity: 'error' });
      return;
    }

    setLoading(true);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    try {
        let photoUrl = userData.photoUrl;
        if (newPhoto) {
            photoUrl = await uploadFile(newPhoto);
        }

        if (formData.newPassword) {
            await updatePassword(currentUser, formData.newPassword);
        }

        const userDocRef = doc(db, 'users', user.uid);
        const updatedData = {
            phone: formData.phone,
            photoUrl: photoUrl,
        };
        await updateDoc(userDocRef, updatedData);

        onProfileUpdate({ ...userData, ...updatedData });

        setFeedback({ open: true, message: t('profile_updated_successfully'), severity: 'success' });
        onClose();
    } catch (error) {
        console.error(t('error_updating_profile'), error);
        let errorMessage = t('error_updating_profile');
        if (error.code === 'auth/requires-recent-login') {
            errorMessage = t('requires_recent_login_error');
        }
        setFeedback({ open: true, message: errorMessage, severity: 'error' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('edit_profile')}</DialogTitle>
        <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Avatar src={previewUrl} sx={{ width: 120, height: 120 }} />
            </Box>
            <Button
              variant="contained"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              {t('upload_profile_photo')}
              <input type="file" hidden onChange={handleFileChange} accept="image/*" />
            </Button>
          <TextField
            margin="dense"
            name="phone"
            label={t('phone_number')}
            type="tel"
            fullWidth
            variant="outlined"
            value={formData.phone || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="newPassword"
            label={t('new_password')}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={formData.newPassword || ''}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            margin="dense"
            name="confirmPassword"
            label={t('confirm_new_password')}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={formData.confirmPassword || ''}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : t('update_profile')}
          </Button>
        </DialogActions>
      </Dialog>
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
    </>
  );
};

EditProfileDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  userData: PropTypes.object,
  onProfileUpdate: PropTypes.func.isRequired,
};

export default EditProfileDialog;
