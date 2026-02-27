import { Box, Typography } from '@mui/material';
import { Campaign } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './Marquee.css';

const Marquee = () => {
    const { t } = useTranslation();

    return (
        <Box sx={{ 
            backgroundImage: 'url(https://i.ibb.co/zWdkLdJZ/Gemini-Generated-Image-sywukusywukusywu.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'red', 
            py: 1, 
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            backgroundAttachment: 'fixed',
        }}>
            <Campaign sx={{ mx: 2, color: 'red' }} />
            <Typography 
                variant="body1"
                className="marquee-text"
                sx={{ textTransform: 'capitalize' }}
            >
                {t('your_next_official_stay', 'Your next official stay is just a few clicks away. Register or log in to the E-Awas portal to book your government-approved quarters and guest houses today.')}
            </Typography>
        </Box>
    );
};

export default Marquee;
