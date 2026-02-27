import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
    Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Chip, CircularProgress, Alert, Button 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

// No props passed to this component
const MyQuarterApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setLoading(true);
        const q = query(
          collection(db, "applications"),
          where("userId", "==", user.uid),
          where("applicationType", "==", "quarterAllotment")
        );

        const unsubscribeSnapshot = onSnapshot(q, async (querySnapshot) => {
          const appsData = await Promise.all(querySnapshot.docs.map(async (appDoc) => {
            const app = { id: appDoc.id, ...appDoc.data() };
            const quarterDoc = await getDoc(doc(db, 'quarters', app.quarterId));
            const quarterData = quarterDoc.exists() ? quarterDoc.data() : {};
            return { 
                ...app, 
                quarterName: quarterData.name || t('unknown_quarter'),
                shortQuarterId: quarterData.shortQuarterId || t('n_a'),
                location: quarterData.location || t('unknown_location'),
            };
          }));
          appsData.sort((a, b) => (b.appliedOn?.toDate() || 0) - (a.appliedOn?.toDate() || 0));
          setApplications(appsData);
          setLoading(false);
        }, (err) => {
          console.error(t('firebase_onsnapshot_error'), err);
          setError(t('error_fetching_applications'));
          setLoading(false);
        });

        return () => unsubscribeSnapshot();

      } else {
        setApplications([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [t]);

  const handleViewLetter = (url) => {
    const correctedUrl = url.replace('/raw/upload/', '/image/upload/');
    setSelectedImage(correctedUrl);
    setLightboxOpen(true);
  };

  const handleViewQuarter = (quarterId) => {
    navigate(`/quarter/${quarterId}`);
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'approved':
        color = 'success';
        break;
      case 'rejected':
        color = 'error';
        break;
      default:
        color = 'warning';
    }
    return <Chip label={t(status)} color={color} />;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper sx={{ p: 2, margin: 'auto', marginTop: 4 }}>
      <Typography variant="h5" gutterBottom>{t('my_quarter_applications')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('quarter_name_blank_note')}
      </Typography>
      {applications.length === 0 ? (
        <Alert severity="info">{t('no_quarter_applications_found')}</Alert>
      ) : (
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('application_id')}</TableCell>
                <TableCell>{t('quarter_name')}</TableCell>
                <TableCell>{t('quarter_id')}</TableCell>
                <TableCell>{t('location')}</TableCell>
                <TableCell>{t('applied_on')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell align="center">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell component="th" scope="row">{app.id}</TableCell>
                  <TableCell>{app.quarterName}</TableCell>
                  <TableCell>{app.shortQuarterId}</TableCell>
                  <TableCell>{app.location}</TableCell>
                  <TableCell>{app.appliedOn?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusChip(app.status)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button size="small" variant="contained" onClick={() => handleViewQuarter(app.quarterId)}>{t('view_quarter')}</Button>
                        {app.joiningLetterUrl && (
                        <Button size="small" variant="outlined" onClick={() => handleViewLetter(app.joiningLetterUrl)}>{t('view_joining_letter')}</Button>
                        )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

        <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={selectedImage ? [{ src: selectedImage }] : []}
            plugins={[Zoom]}
        />
    </Paper>
  );
}

export default MyQuarterApplications;