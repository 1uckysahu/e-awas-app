import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Typography, Box, CircularProgress, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TablePagination, Chip, Avatar,
} from '@mui/material';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Person as PersonIcon, Home as HomeIcon } from '@mui/icons-material';

const PaymentHistory = ({ officer }) => {
    const { t } = useTranslation();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const fetchPaymentHistory = useCallback(async () => {
        if (!officer?.uid) {
            setError(t('officer_not_identified'));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const guestHousesQuery = query(collection(db, 'guesthouses'), where('officerId', '==', officer.uid));
            const guestHousesSnapshot = await getDocs(guestHousesQuery);

            if (guestHousesSnapshot.empty) {
                setPayments([]);
                setLoading(false);
                return;
            }
            const guestHouseIds = guestHousesSnapshot.docs.map(doc => doc.id);
            const guestHousesMap = new Map(guestHousesSnapshot.docs.map(doc => [doc.id, doc.data()]));

            const applicationsQuery = query(
                collection(db, 'applications'), 
                where('guestHouseId', 'in', guestHouseIds),
                where('applicationType', '==', 'guestHouseBooking'),
                where('status', 'in', ['confirmed', 'pending_payment'])
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);

            if (applicationsSnapshot.empty) {
                setPayments([]);
                setLoading(false);
                return;
            }

            const paymentsData = await Promise.all(applicationsSnapshot.docs.map(async (applicationDoc) => {
                const application = { id: applicationDoc.id, ...applicationDoc.data() };
                const guestHouse = guestHousesMap.get(application.guestHouseId);
                
                let user = { fullName: t('unknown_user'), photoUrl: '' };
                if (application.userId) {
                    const userDocRef = doc(db, "users", application.userId);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        user = userDoc.data();
                    }
                }

                return { ...application, guestHouse, user };
            }));
            
            const validPayments = paymentsData.filter(Boolean);
            validPayments.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

            setPayments(validPayments);

        } catch (err) {
            console.error("Error fetching payment history: ", err);
            setError(t('error_fetching_payment_history'));
        } finally {
            setLoading(false);
        }
    }, [officer, t]);

    useEffect(() => {
        fetchPaymentHistory();
    }, [fetchPaymentHistory]);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending_payment':
                return 'warning';
            default:
                return 'error';
        }
    };


    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error" sx={{ my: 4, textAlign: 'center' }}>{error}</Typography>;

    return (
        <Paper sx={{ p: { xs: 1, sm: 2 }, width: '100%' }}>
             <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                {t('payment_history')}
            </Typography>
            {payments.length === 0 ? (
                <Typography sx={{mt: 2, textAlign: 'center'}}>{t('no_payment_history_found')}</Typography>
            ) : (
                <>
                    <TableContainer>
                        <Table stickyHeader aria-label="payment history table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('applicant_name')}</TableCell>
                                    <TableCell>{t('guest_house')}</TableCell>
                                    <TableCell>{t('dates')}</TableCell>
                                    <TableCell align="right">{t('amount')}</TableCell>
                                    <TableCell>{t('payment_date')}</TableCell>
                                    <TableCell align="center">{t('transaction_status')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                                    <TableRow hover key={p.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar src={p.user.photoUrl} sx={{ mr: 1.5, width: 32, height: 32 }}>
                                                    {!p.user.photoUrl && <PersonIcon fontSize="small"/>}
                                                </Avatar>
                                                {p.user.fullName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar variant="rounded" src={p.guestHouse?.mainImageUrl} sx={{ mr: 1.5, width: 32, height: 32}}>
                                                    {!p.guestHouse?.mainImageUrl && <HomeIcon fontSize="small"/>}
                                                </Avatar>
                                                {p.guestHouse?.name || t('unknown_guest_house')}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{`${p.startDate.toDate().toLocaleDateString()} - ${p.endDate.toDate().toLocaleDateString()}`}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{`₹${p.totalAmount}`}</TableCell>
                                        <TableCell>{p.createdAt.toDate().toLocaleString()}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={t(p.status)}
                                                color={getStatusChipColor(p.status)}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={payments.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage={t('rows_per_page')}
                    />
                </>
            )}
        </Paper>
    );
};

PaymentHistory.propTypes = {
  officer: PropTypes.shape({
    uid: PropTypes.string,
  }),
};

export default PaymentHistory;
