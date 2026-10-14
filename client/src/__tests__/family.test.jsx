import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import FamilyPage from '../pages/FamilyPage.jsx';
import { api } from '../api/client';
import { renderWithProviders } from './testUtils.jsx';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    api: {
      getFamilyMembers: vi.fn(),
      saveFamilyMembers: vi.fn(),
    },
  };
});

const SELF_ROW = {
  id: 1, name: 'Maneesh Sharma', dateOfBirth: '1985-05-10', age: 41,
  relationship: 'Self', mobile: '9999999999', livingTogether: 'NA', isSelf: true,
};
const SPOUSE_ROW = {
  id: 2, name: 'Priya Sharma', dateOfBirth: '1988-03-15', age: 38,
  relationship: 'Spouse', mobile: '9876543210', livingTogether: 'Yes', isSelf: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FamilyPage', () => {
  test('renders the Self row first, with no edit/remove icons and "NA" living together', async () => {
    api.getFamilyMembers.mockResolvedValue([SELF_ROW, SPOUSE_ROW]);

    render(renderWithProviders(<FamilyPage />));

    await waitFor(() => expect(api.getFamilyMembers).toHaveBeenCalled());

    const rows = await screen.findAllByRole('row');
    const selfRow = rows[1]; // rows[0] is the header row
    expect(within(selfRow).getByText('Maneesh Sharma')).toBeInTheDocument();
    expect(within(selfRow).getByText('NA')).toBeInTheDocument();
    expect(within(selfRow).queryByTitle('Update')).not.toBeInTheDocument();
    expect(within(selfRow).queryByTitle('Remove')).not.toBeInTheDocument();

    const spouseRow = rows[2];
    expect(within(spouseRow).getByText('Priya Sharma')).toBeInTheDocument();
    expect(within(spouseRow).getByTitle('Update')).toBeInTheDocument();
    expect(within(spouseRow).getByTitle('Remove')).toBeInTheDocument();
  });
});
