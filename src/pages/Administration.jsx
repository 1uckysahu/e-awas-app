import { Typography, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Administration = () => {
  const { t } = useTranslation();
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('administration')}
      </Typography>
    </Container>
  );
};

export default Administration;
