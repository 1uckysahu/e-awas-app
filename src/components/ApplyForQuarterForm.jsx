import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, CircularProgress, Alert, TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadFile } from '../cloudinary';
import { useTranslation } from 'react-i18next';

const ApplyForQuarterForm = ({ quarter, onSuccess }) => {
  const [joiningLetter, setJoiningLetter] = useState(null);
  const [joiningDate, setJoiningDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setJoiningLetter(file);
      setError('');
    } else {
      setJoiningLetter(null);
      setError(t('error_image_only'));
    }
  };

  const handleSubmit = async () => {
    if (!quarter) {
        setError(t('no_quarter_selected'));
        return;
    }
    if (!joiningLetter) {
      setError(t('error_joining_letter_required'));
      return;
    }
    if (!joiningDate) {
        setError(t('error_joining_date_required'));
        return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error(t('user_not_logged_in'));
      }

      const downloadURL = await uploadFile(joiningLetter);

      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName,
        quarterId: quarter.id,
        quarterName: quarter.name,
        applicationType: 'quarterAllotment',
        status: 'pending',
        appliedOn: serverTimestamp(),
        joiningDate: joiningDate,
        joiningLetterUrl: downloadURL,
      });

      setSuccess(t('application_submitted_successfully'));
      setLoading(false);
      if(onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || t('application_submission_failed'));
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ mb: 2 }}>{t('apply_for_quarter_instructions_image')}</Typography>
      
      <Button variant="contained" component="label" sx={{ mb: 2 }}>
        {t('upload_joining_letter')}
        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
      </Button>
      
      {joiningLetter && <Typography sx={{ mb: 2 }}>{joiningLetter.name}</Typography>}
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
              label={t('joining_date')}
              value={joiningDate}
              onChange={(newValue) => {
                  setJoiningDate(newValue);
              }}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
          />
      </LocalizationProvider>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading} fullWidth>
        {loading ? <CircularProgress size={24} /> : t('submit_application')}
      </Button>
    </Box>
  );
};

ApplyForQuarterForm.propTypes = {
  quarter: PropTypes.object.isRequired,
  onSuccess: PropTypes.func,
};

export default ApplyForQuarterForm;