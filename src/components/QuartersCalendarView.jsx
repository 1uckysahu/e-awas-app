import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

const QuartersCalendarView = ({ officerLocation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (user && officerLocation) {
        const quartersQuery = query(
          collection(db, 'quarters'),
          where('location', '==', officerLocation)
        );
        const quartersSnapshot = await getDocs(quartersQuery);
        const quarterIds = quartersSnapshot.docs.map(doc => doc.id);

        if (quarterIds.length > 0) {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('quarterId', 'in', quarterIds),
            where('status', '==', 'approved')
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const bookingEvents = bookingsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              title: `${data.guestName} - ${data.quarterName}`,
              start: data.checkInDate,
              end: data.checkOutDate,
              allDay: true
            };
          });
          setEvents(bookingEvents);
        }
      }
    } catch (err) {
      setError(t('error_fetching_bookings'));
      console.error("Error fetching bookings: ", err);
    } finally {
      setLoading(false);
    }
  }, [officerLocation, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={events}
      height="auto"
    />
  );
};

QuartersCalendarView.propTypes = {
  officerLocation: PropTypes.string.isRequired,
};

export default QuartersCalendarView;
