import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    Container, Card, CardContent, Typography, Button, CircularProgress,
    Alert, Box, Divider, List, ListItem, ListItemText, Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import useRazorpay from '../hooks/useRazorpay';

const Payment = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const { t } = useTranslation();
    const isRazorpayLoaded = useRazorpay();

    const [application, setApplication] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [numberOfNights, setNumberOfNights] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

    useEffect(() => {
        const fetchApplicationDetails = async () => {
            if (!applicationId) {
                setError(t('no_application_id_provided'));
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const appRef = doc(db, 'applications', applicationId);
                const appSnap = await getDoc(appRef);

                if (!appSnap.exists()) throw new Error(t('application_not_found'));

                const appData = appSnap.data();

                if (appData.status === 'confirmed') {
                    setError(t('booking_already_paid'));
                    setLoading(false);
                    return;
                }

                if (appData.status !== 'pending_payment') {
                    setError(t('booking_cannot_be_paid', { status: appData.status }));
                    setLoading(false);
                    return;
                }

                const guestHouseRef = doc(db, 'guesthouses', appData.guestHouseId);
                const guestHouseSnap = await getDoc(guestHouseRef);

                if (!guestHouseSnap.exists()) {
                    throw new Error(t('guesthouse_details_not_found'));
                }

                const guestHouseData = guestHouseSnap.data();
                const pricePerNight = parseFloat(guestHouseData.price);

                if (isNaN(pricePerNight) || pricePerNight <= 0) {
                    setError(t('invalid_guesthouse_price'));
                    setLoading(false);
                    return;
                }

                const startDate = appData.startDate.toDate();
                const endDate = appData.endDate.toDate();
                const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
                const finalTotal = nights * pricePerNight;

                setApplication({
                    ...appData,
                    guestHouseName: guestHouseData.name,
                    pricePerNight: pricePerNight,
                    startDate: startDate,
                    endDate: endDate,
                });
                setNumberOfNights(nights);
                setTotalAmount(finalTotal);
            } catch (err) {
                console.error("Error fetching application details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationDetails();
    }, [applicationId, t]);

    const handlePayment = async () => {
        if (!isRazorpayLoaded) {
            setError(t('payment_gateway_load_error'));
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            name: t('e_awas_booking_payment'),
            description: t('booking_for', { guestHouseName: application?.guestHouseName }),
            receipt: applicationId,
            handler: async (response) => {
                console.log('Updating Firestore Document:', applicationId);
                try {
                    const applicationRef = doc(db, 'applications', applicationId);
                    await updateDoc(applicationRef, {
                        status: 'confirmed',
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id || null,
                        paymentSignature: response.razorpay_signature || null,
                        paymentDate: serverTimestamp(),
                        userId: user.uid,
                    });
                    setSuccess(true);
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 3000);
                } catch (err) {
                    console.error("Failed to update booking status:", err);
                    setError(t('payment_successful_update_failed'));
                }
            },
            prefill: {
                name: user?.displayName || t('e_awas_user'),
                email: user?.email,
            },
            theme: {
                color: '#673ab7',
            },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
    };

    if (loading) {
        return <Container sx={{ textAlign: 'center', mt: 5 }}><CircularProgress /></Container>;
    }

    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Card elevation={4} sx={{ borderRadius: 4 }}>
                <Box sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', color: 'white', p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">{t('payment_summary')}</Typography>
                </Box>
                <CardContent>
                    <List>
                        <ListItem>
                            <ListItemText primary={<Typography color="text.secondary">{t('guest_house')}</Typography>} />
                            <Typography variant="body1">{application?.guestHouseName}</Typography>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary={<Typography color="text.secondary">{t('check_in')}</Typography>} />
                            <Typography variant="body1">{application?.startDate?.toLocaleDateString() || 'N/A'}</Typography>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary={<Typography color="text.secondary">{t('check_out')}</Typography>} />
                            <Typography variant="body1">{application?.endDate?.toLocaleDateString() || 'N/A'}</Typography>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary={<Typography color="text.secondary">{t('nights')}</Typography>} />
                            <Typography variant="body1">{numberOfNights}</Typography>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary={<Typography color="text.secondary">{t('price_per_night')}</Typography>} />
                            <Typography variant="body1">₹{application?.pricePerNight}</Typography>
                        </ListItem>
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2, px: 2 }}>
                        <Typography variant="h6">{t('total')}</Typography>
                        <Typography variant="h5" color="primary" fontWeight="bold">₹{totalAmount}</Typography>
                    </Box>
                    <Box mt={3} px={2}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            size="large" 
                            onClick={handlePayment} 
                            disabled={!isRazorpayLoaded || !totalAmount || totalAmount <= 0}
                            sx={{
                                borderRadius: '50px',
                                fontWeight: 'bold',
                                boxShadow: 'none',
                                py: 1.2
                            }}
                        >
                            {t('pay_securely')}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                    {t('booking_confirmed_message', { guestHouseName: application?.guestHouseName, startDate: application?.startDate?.toLocaleDateString(), endDate: application?.endDate?.toLocaleDateString() })}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Payment;
