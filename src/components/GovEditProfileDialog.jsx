
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, TextField, Button, Box, Avatar, Snackbar, Alert, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../firebase';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';

const GovEditProfileDialog = ({ open, onClose, user, userData, onProfileUpdate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        phone: userData.phone || '',
        password: '',
        confirmPassword: '',
      });
      setPreviewUrl(userData.photoUrl || '');
    }
  }, [userData, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'e-awas'); 
    const res = await fetch('https://api.cloudinary.com/v1_1/dtrczs6co/image/upload', {
      method: 'POST',
      body: uploadData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoUrl = userData.photoUrl;
      if (formData.photo) {
        photoUrl = await uploadToCloudinary(formData.photo);
      }

      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          setFeedback({ open: true, message: t('passwords_do_not_match'), severity: 'error' });
          setLoading(false);
          return;
        }

        const currentPassword = prompt(t('re_enter_current_password_prompt'));
        if (!currentPassword) {
            setLoading(false);
            return;
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, formData.password);
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
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('incorrect_password_error');
      }
      setFeedback({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('edit_profile')}
          <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Avatar src={previewUrl} sx={{ width: 120, height: 120 }} />
          </Box>
          <Button variant="contained" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
            {t('upload_profile_photo')}
            <input type="file" hidden onChange={handleFileChange} accept="image/*" />
          </Button>
          <TextField margin="dense" name="phone" label={t('phone_number')} type="tel" fullWidth variant="outlined" value={formData.phone || ''} onChange={handleChange} />
          <TextField margin="dense" name="password" label={t('new_password')} type="password" fullWidth variant="outlined" value={formData.password || ''} onChange={handleChange} />
          <TextField margin="dense" name="confirmPassword" label={t('confirm_new_password')} type="password" fullWidth variant="outlined" value={formData.confirmPassword || ''} onChange={handleChange} />
        </DialogContent>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} sx={{ mr: 1 }}>{t('cancel')}</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                {loading ? t('updating') : t('update_profile')}
            </Button>
        </Box>
      </Dialog>
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({ ...feedback, open: false })}>
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

GovEditProfileDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  userData: PropTypes.object,
  onProfileUpdate: PropTypes.func.isRequired,
};

export default GovEditProfileDialog;
