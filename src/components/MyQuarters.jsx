import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
    Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, 
    Box, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, 
    DialogActions 
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const MyQuarters = ({ onEdit, refreshKey, officerLocation, onQuarterDeleted }) => {
    const { t } = useTranslation();
    const [myQuarters, setMyQuarters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [quarterToDelete, setQuarterToDelete] = useState(null);

    useEffect(() => {
        const fetchQuarters = async () => {
            setLoading(true);
            setError(null);
            if (!officerLocation) {
                setError(t('officer_location_not_set'));
                setLoading(false);
                return;
            }
            try {
                const q = query(collection(db, 'quarters'), where('location', '==', officerLocation));
                const querySnapshot = await getDocs(q);
                const quarters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMyQuarters(quarters);
            } catch (err) {
                setError(t('error_fetching_quarters'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuarters();
    }, [refreshKey, officerLocation, t]);

    const handleDeleteClick = (quarter) => {
        setQuarterToDelete(quarter);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!quarterToDelete) return;
        try {
            await deleteDoc(doc(db, 'quarters', quarterToDelete.id));
            setOpenDeleteDialog(false);
            setQuarterToDelete(null);
            onQuarterDeleted(); // Refresh the list
        } catch (err) {
            setError(t('failed_to_delete_quarter'));
            console.error(err);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Grid container spacing={4}>
                {myQuarters.length > 0 ? (
                    myQuarters.map(quarter => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={quarter.id}>
                            <Card sx={{ height: '100%' }}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={quarter.mainImageUrl || 'https://via.placeholder.com/150'}
                                    alt={quarter.name}
                                />
                                <CardContent>
                                    <Typography gutterBottom variant="h6">
                                        {quarter.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {quarter.address}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small" onClick={() => onEdit(quarter)}>{t('edit')}</Button>
                                    <Button size="small" color="error" onClick={() => handleDeleteClick(quarter)}>{t('delete')}</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Typography>{t('no_quarters_found')}</Typography>
                )}
            </Grid>
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>{t('confirm_delete_title')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('confirm_delete_message', { houseName: quarterToDelete?.name })}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>{t('cancel')}</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        {t('delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

MyQuarters.propTypes = {
    onEdit: PropTypes.func.isRequired,
    refreshKey: PropTypes.number.isRequired,
    officerLocation: PropTypes.string,
    onQuarterDeleted: PropTypes.func.isRequired,
};

export default MyQuarters;