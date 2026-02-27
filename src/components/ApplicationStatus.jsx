import { useState, useEffect, useCallback } from 'react';
import { Typography, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Tabs, Tab } from '@mui/material';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from 'react-i18next';

const ApplicationStatus = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const { t } = useTranslation();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
        setLoading(false);
        return;
    }

    try {
        const guestHousesQuery = query(collection(db, 'guesthouses'), where('officerId', '==', user.uid));
        const guestHousesSnapshot = await getDocs(guestHousesQuery);
        const guestHouseIds = guestHousesSnapshot.docs.map(doc => doc.id);

        if (guestHouseIds.length === 0) {
            setBookings([]);
            setLoading(false);
            return;
        }

        const bookingsQuery = query(collection(db, 'bookings'), where('guestHouseId', 'in', guestHouseIds));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsData = await Promise.all(bookingsSnapshot.docs.map(async (bookingDoc) => {
            const bookingData = bookingDoc.data();

            const userDocRef = doc(db, "users", bookingData.userId);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : { fullName: t('unknown_user') };

            const guestHouseDocRef = doc(db, "guesthouses", bookingData.guestHouseId);
            const guestHouseDoc = await getDoc(guestHouseDocRef);
            const guestHouseData = guestHouseDoc.exists() ? guestHouseDoc.data() : { name: t('unknown_guest_house') };

            return {
                id: bookingDoc.id,
                ...bookingData,
                userName: userData.fullName,
                guestHouseName: guestHouseData.name,
            };
        }));

        setBookings(bookingsData);
    } catch (error) {
        console.error(t('error_fetching_bookings'), error);
    } finally {
        setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
      await updateDoc(bookingRef, { status: newStatus });
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error(t('error_updating_booking_status'), error);
    }
  };

  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
  };

  const filteredBookings = bookings.filter(booking => booking.status === filter);

  const statusColors = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'error'
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{t('application_status')}</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={filter} onChange={handleFilterChange} aria-label={t('booking_status_filter')}>
          <Tab label={t('pending')} value="Pending" />
          <Tab label={t('approved')} value="Approved" />
          <Tab label={t('rejected')} value="Rejected" />
        </Tabs>
      </Box>
      {loading ? (
        <Typography>{t('loading_bookings')}</Typography>
      ) : (
        <TableContainer>
          <Table stickyHeader aria-label={t('booking_applications_table')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('applicant_name')}</TableCell>
                <TableCell>{t('guest_house')}</TableCell>
                <TableCell>{t('dates')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell align="right">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.userName}</TableCell>
                  <TableCell>{booking.guestHouseName}</TableCell>
                  <TableCell>{t('date_to_date', { checkIn: booking.checkInDate, checkOut: booking.checkOutDate })}</TableCell>
                  <TableCell>
                    <Chip label={t(booking.status)} color={statusColors[booking.status]} size="small"/>
                  </TableCell>
                  <TableCell align="right">
                    {booking.status === 'Pending' && (
                      <Box>
                        <Button variant="contained" color="success" size="small" sx={{ mr: 1 }} onClick={() => handleStatusUpdate(booking.id, 'Approved')}>{t('approve')}</Button>
                        <Button variant="contained" color="error" size="small" onClick={() => handleStatusUpdate(booking.id, 'Rejected')}>{t('reject')}</Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ApplicationStatus;
