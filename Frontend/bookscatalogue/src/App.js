import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './Components/Login/LoginPage';
import BookListPage from './Components/Books/BookListPage';
import { getAuthToken } from './services/authService';

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <BookListPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
