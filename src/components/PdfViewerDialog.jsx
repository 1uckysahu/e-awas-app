import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const PdfViewerDialog = ({ open, handleClose, pdfUrl }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography>{t('joining_letter')}</Typography>
        <IconButton
          aria-label={t('close')}
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={t('joining_letter')}
            width="100%"
            height="600px"
            style={{ border: 'none' }}
          />
        ) : (
          <Typography>{t('no_pdf_available')}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PdfViewerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  pdfUrl: PropTypes.string,
};

export default PdfViewerDialog;
