import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Avatar, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Email, Phone } from '@mui/icons-material';

const BookingDetailsDialog = ({ open, onClose, booking }) => {
  const { t, i18n } = useTranslation();

  if (!booking) {
    return null;
  }

  // Ensure all necessary data is available, providing defaults where it is not.
  const user = booking.user || {};
  const guestHouseName = booking.guestHouseName || t('unknown_guest_house');
  const status = booking.status || t('status_unknown');
  const startDate = booking.startDate ? booking.startDate.toLocaleDateString(i18n.language) : t('date_unknown');
  const endDate = booking.endDate ? booking.endDate.toLocaleDateString(i18n.language) : t('date_unknown');
  const userName = user.fullName || t('unknown_user');
  const userEmail = user.email || t('email_not_provided');
  const userPhoneNumber = user.phone || t('phone_not_provided');
  const userPhotoURL = user.photoUrl;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        {t('booking_details')}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar src={userPhotoURL} sx={{ width: 120, height: 120, mb: 2 }} />
          <Typography variant="h5">{userName}</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <Email sx={{ mr: 1 }} /> {t('email_address')}:
            </Typography>
            <Typography variant="body1">{userEmail}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <Phone sx={{ mr: 1 }} /> {t('phone_number')}:
            </Typography>
            <Typography variant="body1">{userPhoneNumber}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">{t('booking_information_title')}</Typography>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">{t('guest_house')}:</Typography>
              <Typography variant="body2">{guestHouseName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">{t('status')}:</Typography>
              <Typography variant="body2">{status}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">{t('check_in')}:</Typography>
              <Typography variant="body2">{startDate}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">{t('check_out')}:</Typography>
              <Typography variant="body2">{endDate}</Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={onClose} variant="contained">{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

BookingDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  booking: PropTypes.shape({
    user: PropTypes.shape({
      fullName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
    guestHouseName: PropTypes.string,
    status: PropTypes.string,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  }),
};

export default BookingDetailsDialog;