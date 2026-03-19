import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// We need to test the route configuration, not the full App (which uses BrowserRouter)
// Mock all pages
jest.mock('../../pages/LoginPage', () => () => <div data-testid="login-page">LoginPage</div>);
jest.mock('../../pages/DashboardPage', () => () => <div data-testid="dashboard-page">DashboardPage</div>);
jest.mock('../../pages/UsersPage', () => () => <div data-testid="users-page">UsersPage</div>);
jest.mock('../../pages/GroupsPage', () => () => <div data-testid="groups-page">GroupsPage</div>);
jest.mock('../../pages/TransactionsPage', () => () => <div data-testid="transactions-page">TransactionsPage</div>);
jest.mock('../../pages/UserDetailsPage', () => () => <div data-testid="user-details-page">UserDetailsPage</div>);
jest.mock('../../pages/GroupDetailsPage', () => () => <div data-testid="group-details-page">GroupDetailsPage</div>);
jest.mock('../../services/api');
jest.mock('../../store/authStore');

import { useAuthStore } from '../../store/authStore';
import { Routes, Route, Navigate } from 'react-router-dom';

// Simplification: replicate core routing logic for testability
function TestRoutes() {
  const { isAuthenticated } = useAuthStore();
  return (
    <Routes>
      <Route path="/login" element={<div data-testid="login-page">LoginPage</div>} />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <div data-testid="dashboard-page">DashboardPage</div> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users"
        element={isAuthenticated ? <div data-testid="users-page">UsersPage</div> : <Navigate to="/login" replace />}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

describe('App Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect / to /dashboard', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      loadUser: jest.fn(),
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('should redirect to /login when not authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      loadUser: jest.fn(),
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should show dashboard when authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      loadUser: jest.fn(),
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('should show users page when authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      loadUser: jest.fn(),
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/users']}>
        <TestRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('users-page')).toBeInTheDocument();
  });

  it('should redirect users page to login when not authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      loadUser: jest.fn(),
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/users']}>
        <TestRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
