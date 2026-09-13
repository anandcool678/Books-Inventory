import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { User } from 'lucide-react';
import { authService, setUserDetails, updateUserDetails } from '../../services/authService';

const UserDetailsDialog = ({ open, user, onClose, onUserUpdated }) => {
  const [editedName, setEditedName] = useState(user?.name || '');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setEditedName(user?.name || '');
  }, [user, open]);

  const handleSaveUserName = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      setPasswordError('Name cannot be empty.');
      return;
    }

    const updatedUser = {
      ...(user || {}),
      name: trimmedName,
    };

    try {
      await updateUserDetails({
        name: trimmedName,
      });
      setUserDetails(updatedUser);
      onUserUpdated?.(updatedUser);
      onClose();
    } catch (err) {
      setPasswordError(err.message || 'Unable to update user details.');
    }
  };

  const handlePasswordSave = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setPasswordError('');
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordDialog(false);
    } catch (err) {
      setPasswordError(err.message || 'Unable to change password. Please try again.');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>User Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={18} color="#5d3a9b" />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {user?.name || 'N/A'}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f9f9f9',
                },
              }}
            />

            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
              <Typography sx={{ color: '#6b7280', mb: 1 }}>Profile info</Typography>
              <Typography sx={{ mb: 1 }}><strong>Email:</strong> {user?.email || 'N/A'}</Typography>
              <Typography><strong>Phone:</strong> {user?.phoneNumber || 'N/A'}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Close
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => setShowPasswordDialog(true)}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
            >
              Change Password
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveUserName}
              sx={{
                background: 'linear-gradient(90deg, #4a2e8a 0%, #4b2c7a 100%)',
                color: '#fff',
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              Save Name
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              variant="outlined"
            />
            {passwordError && (
              <Typography sx={{ color: '#b42318', fontWeight: 600 }}>{passwordError}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setShowPasswordDialog(false)} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordSave}
            sx={{
              background: 'linear-gradient(90deg, #4a2e8a 0%, #4b2c7a 100%)',
              color: '#fff',
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserDetailsDialog;
