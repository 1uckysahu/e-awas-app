import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
    Container, Paper, Typography, Box, CircularProgress, Alert, 
    Dialog, DialogTitle, DialogContent, DialogContentText, List, ListItem, ListItemText, 
    ListItemIcon 
} from '@mui/material';
import { Event, Person, Home, DateRange, CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const localizer = momentLocalizer(moment);

const Availability = ({ officer }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!officer?.uid) {
      setLoading(false);
      setError(t('officer_not_found'));
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const guestHousesQuery = query(collection(db, 'guesthouses'), where('officerId', '==', officer.uid));
        const guestHousesSnapshot = await getDocs(guestHousesQuery);
        const officerGuestHouseIds = guestHousesSnapshot.docs.map(doc => doc.id);

        if (officerGuestHouseIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const bookingsQuery = query(collection(db, 'applications'), where('guestHouseId', 'in', officerGuestHouseIds));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookingsPromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
          const data = bookingDoc.data();
          if (data.startDate?.toDate && data.endDate?.toDate) {
            let userName = t('unknown_user');
            let userEmail = t('email_not_provided');

            if(data.userId){
                const userRef = doc(db, 'users', data.userId);
                const userSnap = await getDoc(userRef);
                if(userSnap.exists()){
                    userName = userSnap.data().fullName;
                    userEmail = userSnap.data().email;
                }
            }
            
            return {
              ...data,
              id: bookingDoc.id,
              title: `${data.guestHouseName} - ${t(data.status.toLowerCase())}`,
              start: data.startDate.toDate(),
              end: moment(data.endDate.toDate()).add(1, 'days').toDate(),
              allDay: true,
              userName,
              userEmail
            };
          } else {
            return null;
          }
        });

        const bookings = (await Promise.all(bookingsPromises)).filter(Boolean);
        setEvents(bookings);
      } catch (err) {
        console.error("Error fetching bookings: ", err);
        setError(t('error_fetching_guesthouses'));
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [officer, t]);

  const eventStyleGetter = (event) => {
    let backgroundColor;
    switch(event.status) {
      case 'confirmed': backgroundColor = '#4caf50'; break; // Green
      case 'pending': backgroundColor = '#ffc107'; break; // Amber
      case 'cancelled': backgroundColor = '#f44336'; break; // Red
      default: backgroundColor = '#9e9e9e'; // Grey
    }
    return { style: { backgroundColor, color: 'white', borderRadius: '5px', opacity: 0.8, border: 'none' } };
  };

  const handleSelectEvent = (event) => {
    setSelectedBooking(event);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };
  
  const Legend = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}><Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', mr: 1 }} />{t('confirmed')}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}><Box sx={{ width: 20, height: 20, bgcolor: '#ffc107', mr: 1 }} />{t('pending')}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}><Box sx={{ width: 20, height: 20, bgcolor: '#f44336', mr: 1 }} />{t('cancelled')}</Box>
    </Box>
  );

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h4" gutterBottom align="center">{t('booking_availability_calendar')}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }} align="center">{t('calendar_instructions')}</Typography>
        <Legend />
        <Box sx={{ height: '80vh', mt: 3 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            views={['month', 'week', 'day']}
            tooltipAccessor={event => `${event.title}`}
          />
        </Box>
      </Paper>

      <Dialog open={!!selectedBooking} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
            <Event/> {t('booking_details')}
        </DialogTitle>
        {selectedBooking && (
          <DialogContent>
            <List>
                <ListItem><ListItemIcon><Home/></ListItemIcon><ListItemText primary={t('guest_house')} secondary={selectedBooking.guestHouseName} /></ListItem>
                <ListItem><ListItemIcon><Person/></ListItemIcon><ListItemText primary={t('applicant_name')} secondary={selectedBooking.userName || t('n_a')} /></ListItem>
                <ListItem><ListItemIcon><DateRange/></ListItemIcon><ListItemText primary={t('dates')} secondary={`${moment(selectedBooking.start).format('LL')} - ${moment(selectedBooking.end).subtract(1, 'days').format('LL')}`} /></ListItem>
                <ListItem>
                    <ListItemIcon>
                        {selectedBooking.status === 'confirmed' && <CheckCircle color="success"/>}
                        {selectedBooking.status === 'pending' && <HourglassEmpty color="warning"/>}
                        {selectedBooking.status === 'cancelled' && <Cancel color="error"/>}
                    </ListItemIcon>
                    <ListItemText primary={t('status')} secondary={t(selectedBooking.status.toLowerCase())} />
                </ListItem>
            </List>
            <DialogContentText sx={{p:2}}>{t('contact_guest_prompt')} <strong>{selectedBooking.userEmail || t('email_not_provided')}</strong></DialogContentText>
          </DialogContent>
        )}
      </Dialog>
    </Container>
  );
};

Availability.propTypes = {
    officer: PropTypes.shape({
        uid: PropTypes.string.isRequired,
    }),
};

export default Availability;