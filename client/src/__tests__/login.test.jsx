import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../pages/LoginPage.jsx';
import { api } from '../api/client';
import { renderWithProviders } from './testUtils.jsx';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    api: {
      sendOtp: vi.fn(),
      verifyOtp: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('LoginPage OTP two-step flow', () => {
  test('step 1: validates mobile and moves to OTP step on success', async () => {
    api.sendOtp.mockResolvedValue({ mobile: '9999999999', otpExpiresInSeconds: 300 });

    render(renderWithProviders(<LoginPage />));

    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => expect(api.sendOtp).toHaveBeenCalledWith('9999999999'));
    expect(await screen.findByText(/enter otp/i)).toBeInTheDocument();
  });

  test('step 2: verifying a valid OTP for an existing user succeeds', async () => {
    api.sendOtp.mockResolvedValue({ mobile: '9999999999', otpExpiresInSeconds: 300 });
    api.verifyOtp.mockResolvedValue({
      exists: true,
      token: 'fake-token',
      user: { id: 1, mobile: '9999999999', name: 'Maneesh Sharma' },
    });

    render(renderWithProviders(<LoginPage />));

    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await screen.findByText(/enter otp/i);

    const otpBoxes = document.querySelectorAll('.otp-box');
    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(otpBoxes[i], { target: { value: digit } });
    });

    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => expect(api.verifyOtp).toHaveBeenCalledWith('9999999999', '123456'));
  });
});
