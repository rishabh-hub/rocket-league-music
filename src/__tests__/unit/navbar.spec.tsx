import { render, screen, waitFor } from '@testing-library/react';

import { Navbar } from '@/components/navbar/navbar'; // Adjust path as needed

// Mock Supabase server client
const mockGetUser = jest.fn();
const mockFrom = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom, // Chainable mock setup
  })),
}));

// Mock chainable Supabase query methods
mockFrom.mockImplementation(() => ({
  select: mockSelect,
}));
mockSelect.mockImplementation(() => ({
  eq: mockEq,
}));
mockEq.mockImplementation(() => ({
  single: mockSingle,
}));

// Mock child components
jest.mock('@/components/navbar/language-switcher', () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">LanguageSwitcher</div>
  ),
}));
jest.mock('@/components/navbar/sign-in-button', () => ({
  SignInButton: () => <div data-testid="sign-in-button">SignInButton</div>,
}));
jest.mock('@/components/navbar/user-dropdown', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserDropdown: (props: any) => (
    <div data-testid="user-dropdown">
      UserDropdown: {props.session} (Pro: {String(props.isProUser)})
    </div>
  ),
}));

// Mock i18n Link component
jest.mock('@/lib/i18n', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: (props: any) => <a href={props.href}>{props.children}</a>,
}));

// Mock paraglide messages
jest.mock('@/paraglide/messages', () => ({
  app_name: () => 'Test App Name',
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders Sign In button and Language Switcher when user is logged out', async () => {
    // Arrange: Mock Supabase to return no user
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    // Act
    render(await Navbar()); // Await because Navbar is async

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test App Name')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      expect(screen.queryByTestId('user-dropdown')).not.toBeInTheDocument();
    });

    // Verify Supabase calls
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).not.toHaveBeenCalled(); // Should not check subscriptions if no user
  });

  it('renders User Dropdown (non-pro) and Language Switcher when user is logged in without active subscription', async () => {
    // Arrange: Mock Supabase to return a user and no active subscription
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'http://example.com/avatar.png',
      },
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    // Mock subscription query to return null or inactive status
    mockSingle.mockResolvedValue({ data: null, error: null }); // No subscription found

    // Act
    render(await Navbar());

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test App Name')).toBeInTheDocument();
      expect(screen.getByTestId('user-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('user-dropdown')).toHaveTextContent(
        'UserDropdown: test@example.com (Pro: false)'
      );
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
    });

    // Verify Supabase calls
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(mockSelect).toHaveBeenCalledWith('status, price_id');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(mockSingle).toHaveBeenCalledTimes(1);
  });

  it('renders User Dropdown (pro) and Language Switcher when user is logged in with active subscription', async () => {
    // Arrange: Mock Supabase to return a user and an active subscription
    const mockUser = {
      id: 'user-456',
      email: 'pro@example.com',
      user_metadata: {}, // No specific metadata needed for this test
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    // Mock subscription query to return an active status
    mockSingle.mockResolvedValue({
      data: { status: 'active', price_id: 'price_123' },
      error: null,
    });

    // Act
    render(await Navbar());

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test App Name')).toBeInTheDocument();
      expect(screen.getByTestId('user-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('user-dropdown')).toHaveTextContent(
        'UserDropdown: pro@example.com (Pro: true)'
      );
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
    });

    // Verify Supabase calls
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(mockSelect).toHaveBeenCalledWith('status, price_id');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
    expect(mockSingle).toHaveBeenCalledTimes(1);
  });
});
