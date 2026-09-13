import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { RefreshCcw } from 'lucide-react';

const BarcodeScannerPanel = ({
  isScannerOpen,
  cameraList,
  scannerError,
  switchCamera,
  stopScanner,
}) => {
  return (
    <Dialog open={isScannerOpen} onClose={stopScanner} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Scan book barcode</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#4b5563', mb: 2 }}>
          Point the camera at the book’s ISBN barcode and keep it centered in the box.
        </Typography>
        <Box
          id="book-scanner-reader"
          sx={{
            width: '100%',
            maxWidth: 420,
            minHeight: 320,
            height: 320,
            mx: 'auto',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #e2e2e2',
            backgroundColor: '#000',
          }}
        />
        {scannerError && (
          <Typography sx={{ color: '#b42318', mt: 2, fontWeight: 600 }}>{scannerError}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={stopScanner}
          sx={{
            borderColor: '#d4d4d4',
            color: '#333',
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Close camera
        </Button>
        {cameraList.length > 1 && (
          <Button
            variant="outlined"
            startIcon={<RefreshCcw size={16} />}
            onClick={switchCamera}
            sx={{
              borderColor: '#d4d4d4',
              color: '#333',
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Switch camera
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScannerPanel;
