import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Typography, Paper, CircularProgress, Box, Link, List, ListItem, ListItemIcon, ListItemText, Autocomplete, TextField, Chip } from '@mui/material';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { LocationOff, Warning } from '@mui/icons-material';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const locationCoordinates = {
    'Raipur': [21.2514, 81.6296],
    'Mahasamund': [21.10, 82.10],
};

function isValidCoordinates(lat, lon) {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

const MapFlyToController = ({ target }) => {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo(target, 15);
        }
    }, [target, map]);
    return null;
};

MapFlyToController.propTypes = {
    target: PropTypes.arrayOf(PropTypes.number),
};

const MapView = ({ officer }) => {
    const { t } = useTranslation();
    const [allGuestHouses, setAllGuestHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flyToTarget, setFlyToTarget] = useState(null);

    const fetchGuestHouses = useCallback(async () => {
        if (!officer?.location) {
            setLoading(false);
            setError(t('officer_location_not_set_map'));
            return;
        }

        setLoading(true);
        try {
            const q = query(collection(db, 'guesthouses'), where('location', '==', officer.location));
            const querySnapshot = await getDocs(q);
            const houses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllGuestHouses(houses);
        } catch (err) {
            console.error(t('error_fetching_guesthouses_map'), err);
            setError(t('error_fetching_guesthouses_map'));
        } finally {
            setLoading(false);
        }
    }, [officer?.location, t]);

    useEffect(() => {
        fetchGuestHouses();
    }, [fetchGuestHouses]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;
    }

    const guestHousesWithCoords = allGuestHouses.filter(house => isValidCoordinates(house.latitude, house.longitude));
    const guestHousesWithoutCoords = allGuestHouses.filter(house => !isValidCoordinates(house.latitude, house.longitude));

    const initialCenter = locationCoordinates[officer.location] || [21.2514, 81.6296];

    return (
        <Box>
            <Autocomplete
                options={allGuestHouses}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                    if (newValue && isValidCoordinates(newValue.latitude, newValue.longitude)) {
                        setFlyToTarget([newValue.latitude, newValue.longitude]);
                    }
                }}
                renderInput={(params) => 
                    <TextField {...params} label={t('search_guest_house')} variant="outlined" />
                }
                renderOption={(props, option) => (
                    <li {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <ListItemText primary={option.name} secondary={option.address} />
                            {!isValidCoordinates(option.latitude, option.longitude) && 
                                <Chip icon={<Warning />} label={t('fix_coordinates')} color="warning" size="small" />
                            }
                        </Box>
                    </li>
                )}
            />
            <Box sx={{ display: 'flex', mt: 2, height: '600px' }}>
                <Paper sx={{ flex: 1, overflow: 'hidden', borderRadius: '12px' }}>
                    <MapContainer center={initialCenter} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution={t('leaflet_attribution')}
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {guestHousesWithCoords.map(house => (
                            <Marker key={house.id} position={[house.latitude, house.longitude]}>
                                <Popup>
                                    <Typography variant="h6">{house.name}</Typography>
                                    <Typography variant="body2">{house.address}</Typography>
                                    <Typography variant="subtitle1" color="primary">{`₹${house.price} / ${t('night')}`}</Typography>
                                    {house.mapLocationUrl && 
                                        <Link href={house.mapLocationUrl} target="_blank" rel="noopener noreferrer">
                                            {t('view_on_google_maps')}
                                        </Link>
                                    }
                                </Popup>
                            </Marker>
                        ))}
                        <MapFlyToController target={flyToTarget} />
                    </MapContainer>
                </Paper>
                {guestHousesWithoutCoords.length > 0 && (
                    <Paper sx={{ width: '300px', ml: 2, p: 2, overflowY: 'auto', borderRadius: '12px' }}>
                        <Typography variant="h6" gutterBottom>{t('guesthouses_missing_coords')}</Typography>
                        <List dense>
                            {guestHousesWithoutCoords.map(house => (
                                <ListItem key={house.id}>
                                    <ListItemIcon>
                                        <LocationOff color="error" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={house.name} 
                                        secondary={t('coords_needed_to_show_on_map')} 
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

MapView.propTypes = {
    officer: PropTypes.shape({
        location: PropTypes.string,
    }),
};

export default MapView;