import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, query, where, onSnapshot, doc, getDoc, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Button, CircularProgress,
    Alert, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import PaymentIcon from '@mui/icons-material/Payment';
import generateReceipt from '../utils/generateReceipt';

const MyBookings = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
            where("applicationType", "==", "guestHouseBooking")
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            try {
                const appsData = await Promise.all(querySnapshot.docs.map(async (appDoc) => {
                    const app = { id: appDoc.id, ...appDoc.data() };

                    if (app.guestHouseId) {
                        const guestHouseDoc = await getDoc(doc(db, 'guesthouses', app.guestHouseId));
                        const guestHouseData = guestHouseDoc.exists() ? guestHouseDoc.data() : {};
                        return {
                            ...app,
                            guestHouseName: guestHouseData.name || t('unknown_guest_house'),
                        };
                    }
                    return {
                        ...app,
                        guestHouseName: app.guestHouseName || t('details_unavailable')
                    };
                }));

                appsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setBookings(appsData);
            } catch (err) {
                console.error("Error processing booking snapshot:", err);
                setError(t('error_processing_bookings'));
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error("Firebase onSnapshot error:", err);
            setError(t('error_fetching_applications'));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, t, db]);

    const handleViewGuestHouse = (guestHouseId) => {
        navigate(`/guesthouse/${guestHouseId}`);
    };
    
    const handleDownloadReceipt = (booking) => {
        generateReceipt(booking).catch(err => {
            console.error("Error generating receipt:", err);
            alert(t('could_not_generate_receipt'));
        });
    };

    const getStatusChip = (status) => {
        let color = 'default';
        if (status === 'confirmed') color = 'success';
        if (status === 'pending' || status === 'pending_payment') color = 'warning';
        if (status === 'rejected') color = 'error';
        return <Chip label={t(status) || status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
    };
    
    const formatDate = (timestamp) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString();
        }
        return t('n_a');
    };

    if (loading) {
        return <Container sx={{ textAlign: 'center', mt: 5 }}><CircularProgress /></Container>;
    }

    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" gutterBottom component="h2" sx={{ fontWeight: 'bold' }}>
                    {t('my_bookings')}
                </Typography>
                {bookings.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>{t('no_bookings_found')}</Alert>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Table aria-label={t('bookings_table')}>
                            <TableHead sx={{ bgcolor: '#f7f9fc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('guest_house')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('check_in')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('check_out')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('status')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row">{booking.guestHouseName}</TableCell>
                                        <TableCell>{formatDate(booking.startDate)}</TableCell>
                                        <TableCell>{formatDate(booking.endDate)}</TableCell>
                                        <TableCell align="center">{getStatusChip(booking.status)}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    disabled={!booking.guestHouseId} // Disable if ID is missing
                                                    onClick={() => handleViewGuestHouse(booking.guestHouseId)}
                                                >
                                                    {t('view_guest_house')}
                                                </Button>
                                                {booking.status === 'pending_payment' && (
                                                    <Button variant="contained" size="small" startIcon={<PaymentIcon />} onClick={() => navigate(`/payment/${booking.id}`)} sx={{ borderRadius: '50px' }}>
                                                        {t('pay_now')}
                                                    </Button>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <Button variant="contained" color="primary" size="small" onClick={() => handleDownloadReceipt(booking)}>
                                                        {t('download_receipt')}
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

MyBookings.propTypes = {
    user: PropTypes.shape({
        uid: PropTypes.string.isRequired,
    }),
};

export default MyBookings;
