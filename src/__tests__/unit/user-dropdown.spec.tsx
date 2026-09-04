import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { UserDropdown } from '@/components/navbar/user-dropdown';

// --- Mocks ---

// Mock next/image
jest.mock('next/image', () => {
  // Add a display name to the component
  const MockImage = ({ src, alt }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock signOut server action
const mockSignOut = jest.fn();
jest.mock('@/app/login/action', () => ({
  signOut: () => mockSignOut(),
}));

// Mock paraglide messages
jest.mock('@/paraglide/messages', () => ({
  my_account: () => 'Account',
  log_out: () => 'Log Out',
  pro_plan_coming_soon: () => 'Pro plan coming soon',
  pro_plan_coming_soon_note: () => 'Nothing is behind a paywall yet.',
  you_are_a_pro: () => 'Pro plan active',
}));

// Mock Icons
jest.mock('@/components/icons', () => ({
  Icons: {
    logOut: () => <span data-testid="logout-icon">LogoutIcon</span>,
    loader: () => <span data-testid="loader-icon">LoaderIcon</span>,
  },
}));

// Mock dropdown components
// Mock dropdown components
jest.mock('@/components/ui/dropdown-menu', () => {
  const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  DropdownMenu.displayName = 'DropdownMenu';

  const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => (
    <button data-testid="dropdown-trigger">{children}</button>
  );
  DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

  const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  );
  DropdownMenuContent.displayName = 'DropdownMenuContent';

  const DropdownMenuItem = ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button
      data-testid="dropdown-item"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick();
        }
      }}
    >
      {children}
    </button>
  );
  DropdownMenuItem.displayName = 'DropdownMenuItem';

  const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  DropdownMenuLabel.displayName = 'DropdownMenuLabel';

  const DropdownMenuSeparator = () => <hr />;
  DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
  };
});

// Mock lucide-react to avoid ES module issues
jest.mock('lucide-react', () => ({
  LogOut: () => <span>LogOut Icon</span>,
}));

// --- Test Suite ---

describe('UserDropdown Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  const defaultProps = {
    session: 'test@example.com',
    isProUser: false,
    userName: 'Test User',
  };

  it('renders user initials when no image is provided', () => {
    render(<UserDropdown {...defaultProps} userImage={undefined} />);

    // Check trigger button initials - use data-testid to be more specific
    const trigger = screen.getByTestId('dropdown-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('T');
    expect(screen.queryByRole('img')).not.toBeInTheDocument(); // No image in trigger

    // Find dropdown content
    const content = screen.getByTestId('dropdown-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Account');

    // Find the initial in the dropdown identity row - use class selector to be more specific
    const identityInitial = screen.getByText('T', { selector: '.size-9' });
    expect(identityInitial).toBeInTheDocument();
  });

  it('renders user image when provided', () => {
    const imageUrl = 'http://example.com/avatar.png';
    render(<UserDropdown {...defaultProps} userImage={imageUrl} />);

    // Get all images and find the one in the trigger
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2); // Should have 2 images (trigger and dropdown)

    // Check the first image (in trigger)
    expect(images[0]).toHaveAttribute('src', imageUrl);
    expect(images[0]).toHaveAttribute('alt', defaultProps.userName);

    // Check dropdown content
    expect(screen.getByText('Account')).toBeInTheDocument();

    // Check the second image (in dropdown)
    expect(images[1]).toHaveAttribute('src', imageUrl);
    expect(images[1]).toHaveAttribute('alt', defaultProps.userName);
  });

  it('shows the Pro plan as unavailable, disabled, for non-pro users', () => {
    render(<UserDropdown {...defaultProps} isProUser={false} />);

    const proButton = screen.getByRole('button', {
      name: 'Pro plan coming soon',
    });
    expect(proButton).toBeInTheDocument();
    expect(proButton).toBeDisabled();
    expect(
      screen.getByText('Nothing is behind a paywall yet.')
    ).toBeInTheDocument();
  });

  it('does not start a checkout when the disabled Pro button is clicked', () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<UserDropdown {...defaultProps} isProUser={false} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Pro plan coming soon' })
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows the active Pro state (disabled) for pro users', () => {
    render(<UserDropdown {...defaultProps} isProUser={true} />);

    const proButton = screen.getByRole('button', { name: 'Pro plan active' });
    expect(proButton).toBeInTheDocument();
    expect(proButton).toBeDisabled();
    expect(
      screen.queryByText('Nothing is behind a paywall yet.')
    ).not.toBeInTheDocument();
  });

  it('calls signOut action and refreshes router on log out click', async () => {
    render(<UserDropdown {...defaultProps} />);

    const logoutMenuItem = screen.getByTestId('dropdown-item');
    expect(logoutMenuItem).toHaveTextContent('Log Out');
    fireEvent.click(logoutMenuItem);

    // Wait for async actions if any (though signOut mock is sync here)
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
