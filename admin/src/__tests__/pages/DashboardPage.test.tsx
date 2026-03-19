import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';
import { useAuthStore } from '../../store/authStore';
import adminService from '../../services/adminService';
import '@testing-library/jest-dom';

jest.mock('../../services/api');
jest.mock('../../store/authStore');
jest.mock('../../services/adminService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DashboardPage', () => {
  const mockLogout = jest.fn();

  const mockStats = {
    totalUsers: 150,
    activeUsers: 120,
    totalGroups: 25,
    activeGroups: 20,
    totalTransactions: 500,
    totalTransactionVolume: 5000000,
    recentActivity: {
      newUsers: 10,
      newGroups: 3,
      newTransactions: 45,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: '1', fullName: 'Admin User', email: 'admin@test.com', role: 'admin' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    (adminService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);
  });

  it('should show loading state initially', () => {
    (adminService.getDashboardStats as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display dashboard content after loading', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(adminService.getDashboardStats).toHaveBeenCalled();
    });
  });

  it('should display error message when stats fail to load', async () => {
    (adminService.getDashboardStats as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });
});
