
import { Typography, Box } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

const Logo = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <LanguageIcon sx={{ color: 'white', mr: 1 }} />
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
        {t('e_awas')}
      </Typography>
    </Box>
  );
};

export default Logo;
