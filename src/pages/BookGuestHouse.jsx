import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { setDoc, doc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Typography, Grid, TextField, Button, Alert, Card, CardMedia, Box, MenuItem, Snackbar, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

const BookGuestHouse = ({ guestHouse, onSuccess }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [purpose, setPurpose] = useState('Personal Tour');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [bookedRanges, setBookedRanges] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!guestHouse.id) return;
      const q = query(
        collection(db, 'applications'),
        where('guestHouseId', '==', guestHouse.id),
        where('status', 'in', ['confirmed', 'pending_payment'])
      );
      const querySnapshot = await getDocs(q);
      const ranges = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          start: moment(data.startDate.toDate()),
          end: moment(data.endDate.toDate()),
        };
      });
      setBookedRanges(ranges);
    };

    fetchBookedDates();
  }, [guestHouse.id]);

  const isDateDisabled = (date) => {
    const momentDate = moment(date);
    for (const range of bookedRanges) {
      if (momentDate.isBetween(range.start, range.end, 'day', '[]')) {
        return true;
      }
    }
    return false;
  };

  const calculateNights = (start, end) => {
    if (!start || !end) return 0;
    const timeDiff = end.diff(start, 'days');
    return timeDiff > 0 ? timeDiff : 0;
  };

  const nights = calculateNights(startDate, endDate);
  const totalAmount = nights * guestHouse.price;

  const handleSubmitBooking = async () => {
    console.log("STEP 1: Starting booking process");
    const user = auth.currentUser;
    if (!user) {
        console.log("ERROR: User not logged in");
        setFeedback({ open: true, message: t('must_login_to_book'), severity: 'error' });
        return;
    }

    if (nights <= 0) {
        console.log("ERROR: Invalid date range");
        setFeedback({ open: true, message: t('please_select_checkin_checkout_dates'), severity: 'error' });
        return;
    }

    console.log("STEP 2: Validating date ranges");
    const selectedRange = { start: moment(startDate), end: moment(endDate) };
    for (const range of bookedRanges) {
        if (selectedRange.start.isBetween(range.start, range.end, 'day', '[]') || selectedRange.end.isBetween(range.start, range.end, 'day', '[]')) {
            console.log("ERROR: Date range overlaps with existing booking");
            setFeedback({ open: true, message: t('selected_dates_overlap_existing_booking'), severity: 'error' });
            return;
        }
    }

    console.log("STEP 3: Setting spinner");
    setSubmitting(true);
    try {
      console.log("STEP 4: Awaiting addDoc");
      const newApplicationRef = doc(collection(db, 'applications'));
      await setDoc(newApplicationRef, {
        guestHouseId: guestHouse.id,
        guestHouseName: guestHouse.name,
        userId: user.uid,
        userName: user.displayName || user.email,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        purpose,
        status: 'pending',
        applicationType: 'guestHouseBooking',
        createdAt: serverTimestamp(),
        applicationId: newApplicationRef.id,
        totalAmount: totalAmount,
        nights: nights,
      });
      console.log("STEP 5: addDoc Success");
      
      setSubmitting(false);
      setFeedback({ open: true, message: t('booking_request_submitted'), severity: 'success' });
      
      console.log("STEP 6: Timeout Started for navigation");
      setTimeout(() => {
        console.log("STEP 7: Navigating to /dashboard");
        navigate('/dashboard');
        if (onSuccess) onSuccess(true);
      }, 2000);

    } catch (err) {
      console.error("ERROR at Step 4/5:", err);
      setSubmitting(false);
      setFeedback({ open: true, message: t('error_creating_booking'), severity: 'error' });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                    <CardMedia
                        component="img"
                        height="250"
                        image={guestHouse.mainImageUrl || 'https://via.placeholder.com/400x250'}
                        alt={guestHouse.name}
                    />
                    <Box sx={{p: 3}}>
                        <Typography variant="h5" component="h2" fontWeight="bold">{guestHouse.name}</Typography>
                        <Typography variant="body1" color="text.secondary">{guestHouse.address}</Typography>
                    </Box>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>{t('select_your_booking_dates')}</Typography>
                <DatePicker
                    label={t('check_in_date')}
                    value={startDate}
                    onChange={setStartDate}
                    minDate={moment()}
                    shouldDisableDate={isDateDisabled}
                    slotProps={{ textField: { fullWidth: true, required: true, variant: 'outlined', sx: { mb: 2 } } }}
                />
                <DatePicker
                    label={t('check_out_date')}
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate ? moment(startDate).add(1, 'days') : moment().add(1, 'days')}
                    shouldDisableDate={isDateDisabled}
                    slotProps={{ textField: { fullWidth: true, required: true, variant: 'outlined', sx: { mb: 2 } } }}
                />
                <TextField
                    label={t('purpose_of_visit')}
                    select
                    fullWidth
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    sx={{mb:2}}
                >
                    <MenuItem value="Official Duty">{t('official_duty')}</MenuItem>
                    <MenuItem value="Retired">{t('retired')}</MenuItem>
                    <MenuItem value="Personal Tour">{t('personal_tour')}</MenuItem>
                </TextField>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitBooking}
                    fullWidth
                    disabled={nights <= 0 || submitting}
                    size="large"
                >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : t('submit_booking_request')}
                </Button>
            </Grid>
        </Grid>
        <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({ ...feedback, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        </Snackbar>
    </LocalizationProvider>
  );
};

BookGuestHouse.propTypes = {
  guestHouse: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    address: PropTypes.string,
    mainImageUrl: PropTypes.string,
  }).isRequired,
  onSuccess: PropTypes.func,
};

BookGuestHouse.defaultProps = {
    onSuccess: () => {},
};

export default BookGuestHouse;