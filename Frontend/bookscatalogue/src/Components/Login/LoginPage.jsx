import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { BookOpen, User, Lock, Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, setAuthToken, setUserDetails } from '../../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    loginEmail: '',
    loginPassword: '',
    fullName: '',
    registerEmail: '',
    phone: '',
    registerPassword: '',
  });
  const [errors, setErrors] = useState({});

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim()) ? '' : 'Enter a valid email address';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return 'Phone number is required';
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 10  ? '' : 'Phone number must have 10 digits';
  };

  const validateField = (field, value) => {
    if (field === 'loginEmail' || field === 'registerEmail') return validateEmail(value);
    if (field === 'phone') return validatePhone(value);
    return '';
  };

  const handleFieldChange = (field, value) => {
    const sanitizedValue = field === 'phone' ? value.replace(/\D/g, '') : value;
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (mode) => {
    const nextErrors = {};

    if (mode === 'login') {
      const loginEmailError = validateField('loginEmail', formData.loginEmail);
      if (loginEmailError) nextErrors.loginEmail = loginEmailError;
    }

    if (mode === 'register') {
      const registerEmailError = validateField('registerEmail', formData.registerEmail);
      const phoneError = validateField('phone', formData.phone);

      if (registerEmailError) nextErrors.registerEmail = registerEmailError;
      if (phoneError) nextErrors.phone = phoneError;
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const registerUser = async () => {
    if (!handleSubmit('register')) {
      return;
    }

    setErrors((prev) => ({ ...prev, submit: '' }));
    setIsSubmitting(true);

    try {
      const data = await authService.signup({
        name: formData.fullName,
        email: formData.registerEmail,
        phoneNumber: formData.phone,
        password: formData.registerPassword,
      });

      const userDetails = {
        name: data.user?.name || formData.fullName,
        email: data.user?.email || formData.registerEmail,
        phoneNumber: data.user?.phoneNumber || formData.phone,
      };

      setAuthToken(data.token);
      setUserDetails(userDetails);
      console.log('User registered successfully:', data);
      setIsRegister(false);
      setFormData((prev) => ({
        ...prev,
        fullName: '',
        registerEmail: '',
        phone: '',
        registerPassword: '',
      }));
      setErrors({});
      navigate('/books');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginUser = async () => {
    if (!handleSubmit('login')) {
      return;
    }

    setErrors((prev) => ({ ...prev, submit: '' }));
    setIsSubmitting(true);

    try {
      const data = await authService.login({
        email: formData.loginEmail,
        password: formData.loginPassword,
      });
      console.log(data);
      const userDetails = {
        name: data.name || formData.loginEmail,
        email: data.email || formData.loginEmail,
        phoneNumber: data.phoneNumber || '',
      };

      setAuthToken(data.token);
      setUserDetails(userDetails);
      console.log('User logged in successfully:', data);
      setErrors({});
      navigate('/books');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <Stack spacing={2} sx={{ mb: 3, alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#f1ecff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5d3a9b',
          }}
        >
          <BookOpen size={30} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f1f1f', fontSize: '2.1rem' }}>
          Book Inventory
        </Typography>

        <Typography variant="body1" sx={{ color: '#6b7280', fontSize: '1.05rem' }}>
          Sign in to manage your collection
        </Typography>
      </Stack>

      <Stack spacing={3} sx={{ mt: 2 }}>
        {errors.submit && (
          <Box
            sx={{
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b42318',
              borderRadius: 2,
              px: 2,
              py: 1.25,
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            {errors.submit}
          </Box>
        )}

        <Box>
          <Typography sx={{ fontWeight: 600, color: '#2b2b2b', mb: 1, fontSize: '0.95rem' }}>
            Email
          </Typography>
          <TextField
            fullWidth
            value={formData.loginEmail}
            placeholder="Enter your email"
            variant="outlined"
            error={Boolean(errors.loginEmail)}
            helperText={errors.loginEmail || ''}
            onBlur={(e) => {
              const error = validateField('loginEmail', e.target.value);
              setErrors((prev) => ({ ...prev, loginEmail: error }));
            }}
            onChange={(e) => handleFieldChange('loginEmail', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#8c8c8c' }}>
                  <User size={18} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: errors.loginEmail ? '#d32f2f' : '#d4d4d4' },
                '&:hover fieldset': { borderColor: errors.loginEmail ? '#d32f2f' : '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: errors.loginEmail ? '#d32f2f' : '#5d3a9b', borderWidth: 2 },
              },
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, color: '#2b2b2b', mb: 1, fontSize: '0.95rem' }}>
            Password
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={formData.loginPassword}
            placeholder="••••••••"
            variant="outlined"
            onChange={(e) => handleFieldChange('loginPassword', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#8c8c8c' }}>
                  <Lock size={18} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: '#8c8c8c' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: '#d4d4d4' },
                '&:hover fieldset': { borderColor: '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: '#5d3a9b', borderWidth: 2 },
              },
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FormControlLabel
            control={<Checkbox sx={{ color: '#5d3a9b', '&.Mui-checked': { color: '#5d3a9b' } }} />}
            label={<Typography sx={{ color: '#3a3a3a', fontSize: '0.95rem' }}>Remember Me</Typography>}
          />

          <Link href="#" underline="hover" sx={{ color: '#5d3a9b', fontWeight: 600, fontSize: '0.95rem' }}>
            Forgot Password?
          </Link>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={loginUser}
          disabled={isSubmitting}
          sx={{
            mt: 1,
            background: 'linear-gradient(90deg, #4a2e8a 0%, #4b2c7a 100%)',
            color: 'white',
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '1.05rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { background: 'linear-gradient(90deg, #422779 0%, #41286d 100%)' },
            '&.Mui-disabled': { background: '#c4b5fd', color: '#fff' },
          }}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In →'}
        </Button>

        <Typography align="center" sx={{ color: '#4b5563', fontSize: '1rem', mt: 1 }}>
          Don’t have an account?{' '}
          <Link
            component="button"
            onClick={(e) => {
              e.preventDefault();
              setErrors({});
              setIsRegister(true);
            }}
            sx={{ color: '#5d3a9b', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign up
          </Link>
        </Typography>
      </Stack>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <Stack spacing={2} sx={{ mb: 3, alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#f1ecff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5d3a9b',
          }}
        >
          <BookOpen size={30} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f1f1f', fontSize: '2.1rem' }}>
          Create an Account
        </Typography>

        <Typography variant="body1" sx={{ color: '#6b7280', fontSize: '1.05rem' }}>
          Sign up to start managing your books
        </Typography>
      </Stack>

      <Stack spacing={3} sx={{ mt: 2 }}>
        {errors.submit && (
          <Box
            sx={{
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b42318',
              borderRadius: 2,
              px: 2,
              py: 1.25,
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            {errors.submit}
          </Box>
        )}

        <Box>
          <Typography sx={{ fontWeight: 600, color: '#2b2b2b', mb: 1, fontSize: '0.95rem' }}>
            Full Name
          </Typography>
          <TextField
            fullWidth
            value={formData.fullName}
            placeholder="Enter your full name"
            variant="outlined"
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#8c8c8c' }}>
                  <User size={18} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: '#d4d4d4' },
                '&:hover fieldset': { borderColor: '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: '#5d3a9b', borderWidth: 2 },
              },
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, color: '#2b2b2b', mb: 1, fontSize: '0.95rem' }}>
            Email
          </Typography>
          <TextField
            fullWidth
            value={formData.registerEmail}
            placeholder="Enter your email"
            variant="outlined"
            error={Boolean(errors.registerEmail)}
            helperText={errors.registerEmail || ''}
            onBlur={(e) => {
              const error = validateField('registerEmail', e.target.value);
              setErrors((prev) => ({ ...prev, registerEmail: error }));
            }}
            onChange={(e) => handleFieldChange('registerEmail', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#8c8c8c' }}>
                  <Mail size={18} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: errors.registerEmail ? '#d32f2f' : '#d4d4d4' },
                '&:hover fieldset': { borderColor: errors.registerEmail ? '#d32f2f' : '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: errors.registerEmail ? '#d32f2f' : '#5d3a9b', borderWidth: 2 },
              },
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, color: '#2b2b2b', mb: 1, fontSize: '0.95rem' }}>
            Phone Number
          </Typography>
          <TextField
            fullWidth
            value={formData.phone}
            placeholder="Enter your phone number"
            variant="outlined"
            error={Boolean(errors.phone)}
            helperText={errors.phone || ''}
            onBlur={(e) => {
              const error = validateField('phone', e.target.value);
              setErrors((prev) => ({ ...prev, phone: error }));
            }}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#8c8c8c' }}>
                  <Phone size={18} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: errors.phone ? '#d32f2f' : '#d4d4d4' },
                '&:hover fieldset': { borderColor: errors.phone ? '#d32f2f' : '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: errors.phone ? '#d32f2f' : '#5d3a9b', borderWidth: 2 },
              },
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, color: '#2b2b2b', mb: 1, fontSize: '0.95rem' }}>
            Password
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            variant="outlined"
            value={formData.registerPassword}
            onChange={(e) => handleFieldChange('registerPassword', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: '#8c8c8c' }}>
                  <Lock size={18} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: '#8c8c8c' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: '#d4d4d4' },
                '&:hover fieldset': { borderColor: '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: '#5d3a9b', borderWidth: 2 },
              },
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
            }}
          />
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={registerUser}
          disabled={isSubmitting}
          sx={{
            mt: 1,
            background: 'linear-gradient(90deg, #4a2e8a 0%, #4b2c7a 100%)',
            color: 'white',
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '1.05rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { background: 'linear-gradient(90deg, #422779 0%, #41286d 100%)' },
            '&.Mui-disabled': { background: '#c4b5fd', color: '#fff' },
          }}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account →'}
        </Button>

        <Typography align="center" sx={{ color: '#4b5563', fontSize: '1rem', mt: 1 }}>
          Already have an account?{' '}
          <Link
            component="button"
            onClick={(e) => {
              e.preventDefault();
              setErrors({});
              setIsRegister(false);
            }}
            sx={{ color: '#5d3a9b', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </Typography>
      </Stack>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f3f3f3',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 500,
          bgcolor: '#f7f7f7',
          borderRadius: 4,
          border: '1px solid #e2e2e2',
          p: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        }}
      >
        {isRegister ? renderRegisterForm() : renderLoginForm()}
      </Box>
    </Box>
  );
};

export default LoginPage;