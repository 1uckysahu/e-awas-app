import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem, Tooltip, IconButton, Avatar } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { styled } from '@mui/material/styles';

const languageOptions = {
  en: { 
    name: 'English',
    flag: 'https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/gb.svg'
  },
  hi: { 
    name: 'हिंदी',
    flag: 'https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/in.svg'
  },
};

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 8,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
  },
}));

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleClose();
  };

  const currentLanguage = i18n.language;
  const currentLangDetails = languageOptions[currentLanguage] || languageOptions.en;

  return (
    <div>
        <Tooltip title={t('change_language', 'Change Language')}>
            <IconButton onClick={handleClick} sx={{ p: 0 }}>
                <Avatar src={currentLangDetails.flag} alt={currentLangDetails.name} sx={{ width: 32, height: 24, borderRadius: '4px' }} variant='square' />
            </IconButton>
        </Tooltip>
      <StyledMenu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        {Object.keys(languageOptions).map((lang) => (
          <MenuItem key={lang} onClick={() => handleLanguageChange(lang)} selected={lang === currentLanguage}>
            <Avatar src={languageOptions[lang].flag} alt={languageOptions[lang].name} sx={{ width: 24, height: 18, mr: 1.5, borderRadius: '3px' }} variant='square' />
            {languageOptions[lang].name}
          </MenuItem>
        ))}
      </StyledMenu>
    </div>
  );
};

export default LanguageSwitcher;