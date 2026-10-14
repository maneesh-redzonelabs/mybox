import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingPage from '../pages/OnboardingPage.jsx';
import { api } from '../api/client';
import { renderWithProviders } from './testUtils.jsx';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    api: {
      createProfile: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem('mybox_pending_mobile', '9000000001');
  sessionStorage.setItem('mybox_verification_token', 'fake-verification-token');
});

describe('OnboardingPage validation', () => {
  test('rejects a blank name', async () => {
    render(renderWithProviders(<OnboardingPage />, { route: '/onboarding' }));
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /finish setup/i }));

    expect(await screen.findByText(/please enter your name/i)).toBeInTheDocument();
    expect(api.createProfile).not.toHaveBeenCalled();
  });

  test('rejects an invalid email', async () => {
    render(renderWithProviders(<OnboardingPage />, { route: '/onboarding' }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } });
    const form = document.querySelector('form');
    fireEvent.submit(form);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(api.createProfile).not.toHaveBeenCalled();
  });

  test('submits valid data to createProfile', async () => {
    api.createProfile.mockResolvedValue({
      token: 'new-token',
      user: { id: 7, mobile: '9000000001', name: 'Jane Doe', email: 'jane@example.com', dateOfBirth: null },
    });

    render(renderWithProviders(<OnboardingPage />, { route: '/onboarding' }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /finish setup/i }));

    await waitFor(() => expect(api.createProfile).toHaveBeenCalledWith(
      { name: 'Jane Doe', email: 'jane@example.com', dateOfBirth: null },
      'fake-verification-token'
    ));
  });
});
