import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { BookOpen, LogOut, ScanLine, Plus } from 'lucide-react';
import { bookService } from '../../services/bookService';
import { setAuthToken } from '../../services/authService';

const BookListPage = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isbnInput, setIsbnInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [toast, setToast] = useState('');

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
    navigate('/');
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
    setIsScannerOpen(false);
  };

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    setError('');
    setScannerError('');

    const scannerElement = document.getElementById('book-scanner-reader');
    if (!scannerElement) {
      setScannerError('Scanner container is not ready yet. Please try again.');
      return;
    }

    const startScan = async () => {
      try {
        const scanner = new Html5Qrcode('book-scanner-reader');
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        const cameraId = cameras && cameras.length > 0 ? cameras[0].id : { facingMode: 'environment' };

        await scanner.start(
          cameraId,
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
      } catch (err) {
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

    const timeoutId = setTimeout(() => {
      startScan();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [handleAddBook, isScannerOpen]);

  const handleScanBarcode = () => {
    setIsScannerOpen(true);
  };

  const filteredBooks = books.filter((book) => {
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
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Search Books
          </Typography>
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

        {isScannerOpen && (
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3, border: '1px solid #e2e2e2', mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Scan book barcode
              </Typography>
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
            </Stack>
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
          </Box>
        )}

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
                {filteredBooks.map((book) => (
                  <Card key={book.id || book.isbn} sx={{ borderRadius: 3, border: '1px solid #e2e2e2', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
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
                          <Typography sx={{ color: '#6b7280', mb: 1 }}>
                            ISBN: {book.isbn || 'N/A'}
                          </Typography>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                            {book.authors && book.authors.length > 0 ? (
                              book.authors.slice(0, 2).map((author, index) => (
                                <Chip key={`${book.id}-author-${index}`} label={author} sx={{ bgcolor: '#f1ecff', color: '#5d3a9b' }} />
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
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default BookListPage;
