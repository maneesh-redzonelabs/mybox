import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import PoliciesPage from '../pages/PoliciesPage.jsx';
import { api } from '../api/client';
import { renderWithProviders } from './testUtils.jsx';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    api: {
      getPolicies: vi.fn(),
      savePolicies: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PoliciesPage', () => {
  test('displays server-computed maturityDate and nextPremiumDate, "N/A" for Single Premium', async () => {
    api.getPolicies.mockResolvedValue([
      {
        id: 1, policyNo: 'LIC-2015-00123', bankName: 'LIC of India', policyType: 'Life Insurance',
        startDate: '2015-04-01', policyTermYears: 20, payingTermYears: 15, emiFrequency: 'Yearly',
        maturityDate: '2035-04-01', nextPremiumDate: '2027-04-01',
      },
      {
        id: 2, policyNo: 'SBI-2021-00456', bankName: 'SBI Life', policyType: 'Life Insurance',
        startDate: '2021-01-10', policyTermYears: 25, payingTermYears: 20, emiFrequency: 'Single Premium',
        maturityDate: '2046-01-10', nextPremiumDate: null,
      },
    ]);

    render(renderWithProviders(<PoliciesPage />));
    await waitFor(() => expect(api.getPolicies).toHaveBeenCalled());

    const rows = await screen.findAllByRole('row');
    const licRow = rows[1];
    expect(within(licRow).getByText('01/04/2035')).toBeInTheDocument();
    expect(within(licRow).getByText('01/04/2027')).toBeInTheDocument();

    const sbiRow = rows[2];
    expect(within(sbiRow).getByText('10/01/2046')).toBeInTheDocument();
    expect(within(sbiRow).getByText('N/A')).toBeInTheDocument();
  });
});
