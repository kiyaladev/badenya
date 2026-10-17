import { render, screen, waitFor, act } from '@testing-library/react';
import App from '../../App';
import { useAuthStore } from '../../store/authStore';
import authService from '../../services/authService';
jest.mock('../../services/api');
jest.mock('../../services/authService');
jest.mock('../../pages/DashboardPage', () => () => <div>Dashboard content</div>);
jest.mock('../../pages/GroupsPage', () => () => <div>Groups content</div>);
const admin = { id: '1', fullName: 'Admin', email: 'admin@example.test', role: 'admin' };
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false, isChecking: true, isLoading: false, error: null });
});
it('keeps the protected destination while checking and restoring the session', async () => {
  window.history.replaceState({}, '', '/groups?search=test');
  let finish!: (value: typeof admin) => void;
  jest.mocked(authService.getCurrentUser).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Vérification');
  expect(window.location.pathname).toBe('/groups');
  await act(async () => { finish(admin); });
  expect(screen.getByText('Groups content')).toBeInTheDocument();
  expect(window.location.search).toBe('?search=test');
});
it('treats a missing session as normal and does not retry bootstrap on the login page', async () => {
  window.history.replaceState({}, '', '/groups');
  jest.mocked(authService.getCurrentUser).mockRejectedValue({ response: { status: 401 } });
  render(<App />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument());
  expect(window.location.pathname).toBe('/login');
  expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Unknown error')).not.toBeInTheDocument();
});
it('clears an expired or suspended session without a document reload', async () => {
  window.history.replaceState({}, '', '/groups');
  jest.mocked(authService.getCurrentUser).mockResolvedValue(admin);
  render(<App />);
  await screen.findByText('Groups content');
  act(() => { window.dispatchEvent(new Event('badenya:session-expired')); });
  await screen.findByRole('button', { name: 'Se connecter' });
  expect(useAuthStore.getState().user).toBeNull();
  expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
});
