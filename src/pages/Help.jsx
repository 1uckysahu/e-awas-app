import PropTypes from 'prop-types';
import {
    Typography,
    Container,
    Paper,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Rule, Gavel, ContactSupport } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const helpTheme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50',
    },
    background: {
      default: '#ecf0f1',
    },
    text: {
      primary: '#34495e',
      secondary: '#7f8c8d',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 700,
      marginBottom: '1.5rem',
      color: '#2c3e50',
      borderBottom: '3px solid #3498db',
      paddingBottom: '0.5rem',
      display: 'inline-block',
    },
    h6: {
      fontWeight: 600,
      marginTop: '2rem',
      marginBottom: '1rem',
      color: '#3498db',
    },
    body1: {
        lineHeight: 1.7,
        textAlign: 'justify',
    }
  },
});

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.spacing(2),
    boxShadow: '0px 10px 25px rgba(0,0,0,0.05)',
}));

const Section = ({ icon, title, children }) => (
    <Box sx={{ my: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
            {icon}
            <Typography variant="h5" component="h2" sx={{ ml: 1.5, fontWeight: 'bold' }}>
                {title}
            </Typography>
        </Box>
        {children}
    </Box>
);

Section.propTypes = {
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

const Help = () => {
    const { t } = useTranslation();
  return (
    <ThemeProvider theme={helpTheme}>
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <StyledPaper>
                <Typography variant="h4" component="h1" gutterBottom>
                    {t('help_and_support')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {t('help_support_intro')}
                </Typography>

                <Section icon={<Gavel color="primary"/>} title={t('quarter_allotment_rules')}>
                    <Typography variant="h6">{t('eligibility_criteria')}</Typography>
                    <Typography variant="body1" paragraph>
                        {t('eligibility_criteria_desc')}
                    </Typography>
                    <Typography variant="h6">{t('allotment_process')}</Typography>
                    <Typography variant="body1" paragraph>
                        {t('allotment_process_desc')}
                    </Typography>
                </Section>

                <Section icon={<Rule color="primary"/>} title={t('guest_house_booking_regulations')}>
                    <Typography variant="h6">{t('booking_priority')}</Typography>
                    <Typography variant="body1" paragraph>
                        {t('booking_priority_desc')}
                    </Typography>
                    <Typography variant="h6">{t('charges_payment')}</Typography>
                    <Typography variant="body1" paragraph>
                        {t('charges_payment_desc')}
                    </Typography>
                </Section>

                <Section icon={<ContactSupport color="primary" />} title={t('faqs')}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{t('faq_password_reset_q')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                {t('faq_password_reset_a')}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{t('faq_multiple_quarters_q')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                {t('faq_multiple_quarters_a')}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Section>

                <Box mt={5} pt={3} borderTop={1} borderColor="grey.300">
                    <Typography variant="h6" gutterBottom>{t('need_further_assistance')}</Typography>
                    <Typography variant="body1">
                        {t('further_assistance_desc')} <Link href={`mailto:${t('support_email')}`}>{t('support_email')}</Link> {t('or_call_us')} <Link href={`tel:${t('support_phone')}`}>{t('support_phone')}</Link>.
                    </Typography>
                </Box>

            </StyledPaper>
        </Container>
    </ThemeProvider>
  );
};

export default Help;
