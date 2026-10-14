import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VehiclesPage from '../pages/VehiclesPage.jsx';
import { api } from '../api/client';
import { renderWithProviders } from './testUtils.jsx';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    api: {
      getVehicles: vi.fn(),
      saveVehicles: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VehiclesPage', () => {
  test('shows an RTO-format validation error message when saving an invalid registration number', async () => {
    api.getVehicles.mockResolvedValue([]);

    render(renderWithProviders(<VehiclesPage />));
    await waitFor(() => expect(api.getVehicles).toHaveBeenCalled());

    const regInput = await screen.findByPlaceholderText(/e\.g\. mh12ab1234/i);
    fireEvent.change(regInput, { target: { value: 'NOTVALID' } });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/valid indian rto registration number/i)).toBeInTheDocument();
    expect(api.saveVehicles).not.toHaveBeenCalled();
  });
});
