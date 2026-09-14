import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { BookOpen, LogOut, ScanLine, Plus, Camera, User, RefreshCcw } from 'lucide-react';
import { bookService } from '../../services/bookService';
import { getUserDetails, setAuthToken, setUserDetails } from '../../services/authService';
import BarcodeScannerPanel from './BarcodeScannerPanel';
import UserDetailsDialog from './UserDetailsDialog';

const READING_STATUS_OPTIONS = [
  { value: 'TBR', label: 'To be Read' },
  { value: 'reading', label: 'Currently reading' },
  { value: 'read', label: 'Read' },
];

const BookListPage = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isbnInput, setIsbnInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyTbr, setShowOnlyTbr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [toast, setToast] = useState('');
  const [cameraList, setCameraList] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetailsState] = useState(() => getUserDetails());

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await bookService.getMyBooks();
        setBooks(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setUserDetails(null);
    setUserDetailsState(null);
    navigate('/');
  };

  const handleOpenUserDetails = () => {
    const currentUser = getUserDetails();
    setUserDetailsState(currentUser || userDetails);
    setShowUserDetails(true);
  };

  const handleUserUpdated = (updatedUser) => {
    setUserDetailsState(updatedUser);
    setUserDetails(updatedUser);
    console.log(updatedUser);
    showToast('User name updated successfully');
  };

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookService.getMyBooks();
      setBooks(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load books');
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      setToast('');
    }, 3000);
  }, []);

  const handleAddBook = useCallback(
    async (isbn) => {
      const normalizedIsbn = isbn.trim();
      if (!normalizedIsbn) {
        showToast('Please enter or scan an ISBN first');
        return;
      }

      try {
        setSaving(true);
        setError('');
        const body = {
          isbn: normalizedIsbn,
        };
        await bookService.scanBookByIsbn(body);
        setIsbnInput('');
        await loadBooks();
      } catch (err) {
        console.log(err);
        const message = err.message || 'Unable to add book';
        setError('');
        setIsbnInput('');
        showToast(message);
      } finally {
        setSaving(false);
      }
    },
    [loadBooks, showToast]
  );

  const stopScanner = async () => {
    if (!scannerRef.current) {
      setIsScannerOpen(false);
      return;
    }

    try {
      if (typeof scannerRef.current.stop === 'function') {
        await scannerRef.current.stop();
      }
    } catch (_err) {
      // Ignore stop errors when the scanner is already inactive.
    }

    try {
      if (typeof scannerRef.current.clear === 'function') {
        await scannerRef.current.clear();
      }
    } catch (_err) {
      // Ignore clear errors when the scanner is already inactive.
    }

    scannerRef.current = null;
    setCameraList([]);
    setCameraIndex(0);
    setIsScannerOpen(false);
  };

  const choosePreferredCamera = (cameras = []) => {
    if (!cameras.length) {
      return null;
    }

    const rearCamera = cameras.find((camera) => /rear|back|environment/i.test(camera.label || '')) || cameras[0];
    return rearCamera;
  };

  const getCameraStartConfig = (camera) => {
    if (!camera) {
      return { facingMode: 'environment' };
    }

    if (typeof camera === 'string') {
      return { deviceId: { exact: camera } };
    }

    if (camera && typeof camera === 'object' && 'id' in camera && typeof camera.id === 'string') {
      return { deviceId: { exact: camera.id } };
    }

    return { facingMode: { ideal: 'environment' } };
  };

  const startScannerWithCamera = useCallback(
    async (targetCamera = null) => {
      const scanner = new Html5Qrcode('book-scanner-reader');
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const availableCameras = Array.isArray(cameras) ? cameras : [];
      setCameraList(availableCameras);

      const selectedCamera = targetCamera || choosePreferredCamera(availableCameras);
      const selectedCameraId = selectedCamera && typeof selectedCamera === 'object' && 'id' in selectedCamera ? selectedCamera.id : selectedCamera;
      const selectedIndex = availableCameras.findIndex((camera) => camera.id === selectedCameraId);
      if (selectedIndex >= 0) {
        setCameraIndex(selectedIndex);
      }

      const cameraConfig = getCameraStartConfig(selectedCameraId || selectedCamera);

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 260, height: 150 },
          aspectRatio: 1.33,
        },
        async (decodedText) => {
          const normalizedIsbn = decodedText.replace(/[^0-9xX]/g, '').toUpperCase();
          const isbnToUse = normalizedIsbn || decodedText.trim();

          if (!isbnToUse) return;

          setIsbnInput(isbnToUse);
          setIsScannerOpen(false);

          try {
            await scanner.stop();
            await scanner.clear();
          } catch (_err) {
            // Ignore cleanup errors.
          }

          scannerRef.current = null;
          await handleAddBook(isbnToUse);
        },
        (scanError) => {
          if (scanError && typeof scanError === 'string' && scanError.includes('NotFound')) {
            return;
          }
        }
      );
    },
    [handleAddBook]
  );

  const switchCamera = useCallback(async () => {
    if (!scannerRef.current || cameraList.length < 2) {
      return;
    }

    const nextIndex = (cameraIndex + 1) % cameraList.length;
    const nextCamera = cameraList[nextIndex];
    setCameraIndex(nextIndex);

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (_err) {
      // Ignore cleanup errors.
    }

    try {
      await startScannerWithCamera(nextCamera);
    } catch (err) {
      setScannerError('Unable to switch camera. Please try again.');
    }
  }, [cameraIndex, cameraList, startScannerWithCamera]);

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    setError('');
    setScannerError('');

    let cancelled = false;

    const startScan = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        const availableCameras = Array.isArray(cameras) ? cameras : [];
        setCameraList(availableCameras);

        const preferredCamera = choosePreferredCamera(availableCameras);
        await startScannerWithCamera(preferredCamera);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setScannerError('Unable to start the camera. Please allow camera access and use localhost or HTTPS.');
        setIsScannerOpen(false);
        if (scannerRef.current) {
          try {
            await scannerRef.current.clear();
          } catch (_err) {
            // Ignore cleanup errors.
          }
          scannerRef.current = null;
        }
      }
    };

    const retryUntilMounted = () => {
      if (cancelled) {
        return;
      }

      const scannerElement = document.getElementById('book-scanner-reader');
      if (!scannerElement) {
        window.setTimeout(retryUntilMounted, 150);
        return;
      }

      startScan();
    };

    const timeoutId = window.setTimeout(retryUntilMounted, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScannerOpen, startScannerWithCamera]);

  const handleScanBarcode = () => {
    setIsScannerOpen(true);
  };

  const normalizeReadDate = (value) => {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value.split('T')[0];
    }

    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  const handleReadingStatusChange = (bookKey, nextStatus) => {
    const selectedBook = books.find((book) => (book.id || book.isbn) === bookKey);
    const nextFinishDate = nextStatus === 'read'
      ? (selectedBook?.readOn ? normalizeReadDate(selectedBook.readOn) : new Date().toISOString().split('T')[0])
      : '';

    setBooks((prevBooks) =>
      prevBooks.map((book) => {
        const currentKey = book.id || book.isbn;
        if (currentKey !== bookKey) return book;

        const updatedBook = { ...book, status: nextStatus };
        if (nextStatus === 'read') {
          updatedBook.readOn = nextFinishDate;
        } else {
          delete updatedBook.readOn;
        }

        return updatedBook;
      })
    );

    const body = {
      status: nextStatus,
      ...(nextStatus === 'read' ? { readOn: nextFinishDate } : {}),
    };

    bookService.updateBookStatus(bookKey, body).catch(() => {});
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleFinishDateChange = (bookKey, finishDate) => {
    const selectedDate = finishDate ? new Date(`${finishDate}T00:00:00`) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate && selectedDate > today) {
      return;
    }

    const readOn = finishDate ? `${finishDate}T00:00:00` : '';

    setBooks((prevBooks) =>
      prevBooks.map((book) => {
        const currentKey = book.id || book.isbn;
        if (currentKey !== bookKey) return book;

        return {
          ...book,
          status: 'read',
          readOn,
        };
      })
    );

    bookService.updateBookStatus(bookKey, { status: 'read', readOn }).catch(() => {});
  };

  const filteredBooks = books.filter((book) => {
    const matchesStatus = !showOnlyTbr || (book.status || 'TBR') === 'TBR';
    if (!matchesStatus) {
      return false;
    }

    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

    const title = (book.title || '').toLowerCase();
    const isbn = (book.isbn || '').toLowerCase();
    const authors = (book.authors || []).join(' ').toLowerCase();

    return title.includes(query) || isbn.includes(query) || authors.includes(query);
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f3f3', p: 4 }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#f1ecff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5d3a9b',
              }}
            >
              <BookOpen size={22} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f1f1f' }}>
              My Books
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<User size={18} />}
              onClick={handleOpenUserDetails}
              sx={{
                borderColor: '#d4d4d4',
                color: '#333',
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              User Details
            </Button>
            <Button
              variant="outlined"
              startIcon={<LogOut size={18} />}
              onClick={handleLogout}
              sx={{
                borderColor: '#d4d4d4',
                color: '#333',
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>

        {toast && (
          <Box
            sx={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 1300,
              maxWidth: 420,
              px: 2.5,
              py: 1.5,
              borderRadius: 2,
              bgcolor: '#b42318',
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.14)',
              fontWeight: 600,
            }}
          >
            {toast}
          </Box>
        )}

        <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3, border: '1px solid #e2e2e2', mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Add a Book
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
            //   fullWidth
              value={isbnInput}
              onChange={(e) => setIsbnInput(e.target.value)}
              placeholder="Enter ISBN number"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f9f9f9',
                  '& fieldset': { borderColor: '#d4d4d4' },
                  '&:hover fieldset': { borderColor: '#b8b8b8' },
                  '&.Mui-focused fieldset': { borderColor: '#5d3a9b', borderWidth: 2 },
                },
              }}
            />

            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => handleAddBook(isbnInput)}
              disabled={saving}
              sx={{
                background: 'linear-gradient(90deg, #4a2e8a 0%, #4b2c7a 100%)',
                color: 'white',
                textTransform: 'none',
                borderRadius: 2,
                width:'fit-content',
                px: 3,
                py: 1.5,
                fontWeight: 700,
                '&:hover': { background: 'linear-gradient(90deg, #422779 0%, #41286d 100%)' },
              }}
            >
              {saving ? 'Saving...' : 'Add Book'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ScanLine size={18} />}
              onClick={handleScanBarcode}
              disabled={saving}
              sx={{
                borderColor: '#d4d4d4',
                color: '#333',
                textTransform: 'none',
                borderRadius: 2,
                width:'fit-content',
                px: 3,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Scan Barcode
            </Button>
          </Stack>
        </Box>

        <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3, border: '1px solid #e2e2e2', mb: 4 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Search Books
            </Typography>

            <Button
              variant={showOnlyTbr ? 'contained' : 'outlined'}
              onClick={() => setShowOnlyTbr((prev) => !prev)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                background: showOnlyTbr ? 'linear-gradient(90deg, #4a2e8a 0%, #4b2c7a 100%)' : 'transparent',
                color: showOnlyTbr ? '#fff' : '#333',
                borderColor: '#d4d4d4',
                px: 2.5,
              }}
            >
              {showOnlyTbr ? 'Showing TBR only' : 'Show TBR only'}
            </Button>
          </Stack>

          <TextField
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author, or ISBN"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f9f9f9',
                '& fieldset': { borderColor: '#d4d4d4' },
                '&:hover fieldset': { borderColor: '#b8b8b8' },
                '&.Mui-focused fieldset': { borderColor: '#5d3a9b', borderWidth: 2 },
              },
            }}
          />
        </Box>

        <BarcodeScannerPanel
          isScannerOpen={isScannerOpen}
          cameraList={cameraList}
          scannerError={scannerError}
          switchCamera={switchCamera}
          stopScanner={stopScanner}
        />

        <UserDetailsDialog
          open={showUserDetails}
          user={userDetails}
          onClose={() => setShowUserDetails(false)}
          onUserUpdated={handleUserUpdated}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#5d3a9b' }} />
          </Box>
        ) : (
          <>
            {error && (
              <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3, border: '1px solid #f0d5d5', mb: 3 }}>
                <Typography sx={{ color: '#b42318', fontWeight: 600 }}>{error}</Typography>
              </Box>
            )}

            {books.length === 0 ? (
              <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 4, border: '1px solid #e2e2e2', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  No books yet
                </Typography>
                <Typography sx={{ color: '#6b7280' }}>
                  Your scanned or uploaded books will appear here.
                </Typography>
              </Box>
            ) : filteredBooks.length === 0 ? (
              <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 4, border: '1px solid #e2e2e2', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  No matching books found
                </Typography>
                <Typography sx={{ color: '#6b7280' }}>
                  Try a different title, author, or ISBN.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {filteredBooks.map((book) => {
                  const bookKey = book.id || book.isbn;
                  const currentStatus = book.status || 'TBR';
                  const readOnValue = normalizeReadDate(book.readOn);

                  return (
                    <Card key={bookKey} sx={{ borderRadius: 3, border: '1px solid #e2e2e2', boxShadow: 'none' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                width: 90,
                                minWidth: 90,
                                height: 130,
                                borderRadius: 2,
                                overflow: 'hidden',
                                bgcolor: '#f1ecff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e2e2',
                              }}
                            >
                              {book.coverImage ? (
                                <img
                                  src={book.coverImage}
                                  alt={book.title || 'Book cover'}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              ) : (
                                <BookOpen size={32} color="#5d3a9b" />
                              )}
                            </Box>

                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {book.title || 'Untitled Book'}
                              </Typography>

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                {book.authors && book.authors.length > 0 ? (
                                  book.authors.slice(0, 2).map((author, index) => (
                                    <Chip key={`${bookKey}-author-${index}`} label={author} sx={{ bgcolor: '#f1ecff', color: '#5d3a9b' }} />
                                  ))
                                ) : (
                                  <Chip label="Unknown author" sx={{ bgcolor: '#f3f4f6', color: '#4b5563' }} />
                                )}
                              </Stack>

                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ color: '#4b5563', fontSize: '0.95rem' }}>
                                <Typography>
                                  Pages: {book.pageCount || 'N/A'}
                                </Typography>
                                <Typography>
                                  Added on: {book.createdAt
                                    ? new Date(book.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'N/A'}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>

                          <Box sx={{ minWidth: { xs: '100%', sm: 190 }, alignSelf: { xs: 'stretch', sm: 'center' } }}>
                            <Select
                              value={currentStatus}
                              onChange={(event) => handleReadingStatusChange(bookKey, event.target.value)}
                              size="small"
                              displayEmpty
                              sx={{
                                width: '100%',
                                borderRadius: 1.5,
                                backgroundColor: '#faf7ff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d4d4d4' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b8b8b8' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5d3a9b', borderWidth: 2 },
                                '& .MuiSelect-select': { py: 1, fontSize: '0.85rem', fontWeight: 600 },
                              }}
                            >
                              {READING_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>

                            {currentStatus === 'read' && (
                              <TextField
                                type="date"
                                label="Finish date"
                                value={readOnValue}
                                onChange={(event) => handleFinishDateChange(bookKey, event.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                  max: getTodayDateString(),
                                }}
                                sx={{
                                  mt: 1.5,
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    backgroundColor: '#faf7ff',
                                    '& fieldset': { borderColor: '#d4d4d4' },
                                    '&:hover fieldset': { borderColor: '#b8b8b8' },
                                    '&.Mui-focused fieldset': { borderColor: '#5d3a9b', borderWidth: 2 },
                                  },
                                }}
                              />
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default BookListPage;
