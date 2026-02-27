import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { 
    Box, TextField, Button, Grid, Typography, IconButton, 
    CircularProgress, Alert, Paper 
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const AddQuarterForm = ({ onFormSubmit, officerLocation, quarterToEdit }) => {
    const { t } = useTranslation();
    const [quarterName, setQuarterName] = useState('');
    const [quarterType, setQuarterType] = useState('');
    const [address, setAddress] = useState('');
    const [mapLocation, setMapLocation] = useState('');
    const [details, setDetails] = useState('');
    const [assets, setAssets] = useState(['']);
    const [mainImageUrl, setMainImageUrl] = useState('');
    const [otherImages, setOtherImages] = useState(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (quarterToEdit) {
            setQuarterName(quarterToEdit.name || '');
            setQuarterType(quarterToEdit.quarterType || '');
            setAddress(quarterToEdit.address || '');
            setMapLocation(quarterToEdit.mapLocation || '');
            setDetails(quarterToEdit.details || '');
            setAssets(quarterToEdit.assets || ['']);
            setMainImageUrl(quarterToEdit.mainImageUrl || '');
            setOtherImages(quarterToEdit.otherImages || ['']);
        }
    }, [quarterToEdit]);

    const handleAssetChange = (index, value) => {
        const newAssets = [...assets];
        newAssets[index] = value;
        setAssets(newAssets);
    };

    const addAssetField = () => {
        setAssets([...assets, '']);
    };

    const removeAssetField = (index) => {
        const newAssets = assets.filter((_, i) => i !== index);
        setAssets(newAssets);
    };

    const handleImageChange = (index, value) => {
        const newImages = [...otherImages];
        newImages[index] = value;
        setOtherImages(newImages);
    };

    const addImageField = () => {
        setOtherImages([...otherImages, '']);
    };

    const removeImageField = (index) => {
        const newImages = otherImages.filter((_, i) => i !== index);
        setOtherImages(newImages);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!officerLocation) {
            setError(t('cannot_save_quarter_no_location'));
            setLoading(false);
            return;
        }

        const quarterData = {
            name: quarterName,
            quarterType,
            address,
            location: officerLocation,
            mapLocation,
            details,
            assets: assets.filter(asset => asset.trim() !== ''),
            mainImageUrl,
            otherImages: otherImages.filter(img => img.trim() !== ''),
            available: quarterToEdit ? quarterToEdit.available : true,
            lastUpdated: serverTimestamp(),
        };

        try {
            if (quarterToEdit) {
                await updateDoc(doc(db, 'quarters', quarterToEdit.id), quarterData);
                setSuccess(t('quarter_updated_successfully'));
            } else {
                await addDoc(collection(db, 'quarters'), {
                    ...quarterData,
                    createdAt: serverTimestamp(),
                });
                setSuccess(t('quarter_added_successfully'));
            }
            onFormSubmit();
            // Reset form if it's not an edit
            if (!quarterToEdit) {
                setQuarterName('');
                setQuarterType('');
                setAddress('');
                setMapLocation('');
                setDetails('');
                setAssets(['']);
                setMainImageUrl('');
                setOtherImages(['']);
            }
        } catch (err) {
            setError(t('failed_to_save_quarter'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mt: 2 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                {quarterToEdit ? t('edit_quarter') : t('add_new_quarter')}
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Top Section: Basic Info */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label={t('quarter_name')} value={quarterName} onChange={(e) => setQuarterName(e.target.value)} required />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label={t('quarter_type')} value={quarterType} onChange={(e) => setQuarterType(e.target.value)} required />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('full_address')} value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('map_location_url')} type="url" value={mapLocation} onChange={(e) => setMapLocation(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth multiline rows={4} label={t('details_description')} value={details} onChange={(e) => setDetails(e.target.value)} />
                    </Grid>

                    {/* Section: Asset Details */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1, mt: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>{t('asset_details')}</Typography>
                            {assets.map((asset, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <TextField
                                        fullWidth
                                        label={`${t('asset_label', { index: index + 1 })}`}
                                        value={asset}
                                        onChange={(e) => handleAssetChange(index, e.target.value)}
                                        size="small"
                                    />
                                    <IconButton
                                        onClick={() => removeAssetField(index)}
                                        aria-label={`${t('remove_asset_field', { index: index + 1 })}`}
                                        sx={{ ml: 1 }}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button startIcon={<AddIcon />} onClick={addAssetField} size="small" sx={{ mt: 1 }}>
                                {t('add_asset')}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Section: Images */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1, mt: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>{t('images')}</Typography>
                            <TextField
                                sx={{ mb: 2 }}
                                fullWidth
                                label={t('main_display_image_url')}
                                type="url"
                                value={mainImageUrl}
                                onChange={(e) => setMainImageUrl(e.target.value)}
                                required
                            />
                            {otherImages.map((image, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <TextField
                                        fullWidth
                                        label={`${t('image_url', { index: index + 1 })}`}
                                        type="url"
                                        value={image}
                                        onChange={(e) => handleImageChange(index, e.target.value)}
                                        size="small"
                                    />
                                    <IconButton
                                        onClick={() => removeImageField(index)}
                                        aria-label={`${t('remove_image_field', { index: index + 1 })}`}
                                        sx={{ ml: 1 }}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button startIcon={<AddIcon />} onClick={addImageField} size="small" sx={{ mt: 1 }}>
                                {t('add_more_images')}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Submit Button Section */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button type="submit" variant="contained" color="primary" disabled={loading} size="large">
                                {loading ? <CircularProgress size={24} color="inherit" /> : (quarterToEdit ? t('save_changes') : t('add_new_quarter'))}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
            {/* Feedback Alerts */}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </Paper>
    );
};

AddQuarterForm.propTypes = {
    onFormSubmit: PropTypes.func.isRequired,
    officerLocation: PropTypes.string.isRequired,
    quarterToEdit: PropTypes.object, // Quarter object for editing
};

export default AddQuarterForm;
