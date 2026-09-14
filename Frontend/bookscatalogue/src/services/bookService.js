import { getAuthHeaders, request } from './authService';

export const bookService = {
  getMyBooks: () =>
    request('/api/books/my-books', {
      method: 'GET',
      headers: getAuthHeaders(),
    }),

  scanBookByIsbn: (body) =>
    request('/api/books/isbn', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
  
  updateBookStatus: (bookId, status) =>
    request(`/api/books/${bookId}/update`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(status ),
    })
};
