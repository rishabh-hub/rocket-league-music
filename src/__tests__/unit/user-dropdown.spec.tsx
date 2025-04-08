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
  my_account: () => 'My Account',
  log_out: () => 'Log Out',
  upgrade_to_pro_cta: () => 'Upgrade to Pro',
  you_are_a_pro: () => 'You are a Pro!',
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
    expect(content).toHaveTextContent('My Account');

    // Find the larger initial in the dropdown - use class selector to be more specific
    const largeInitial = screen.getByText('T', { selector: '.text-3xl' });
    expect(largeInitial).toBeInTheDocument();
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
    expect(screen.getByText('My Account')).toBeInTheDocument();

    // Check the second image (in dropdown)
    expect(images[1]).toHaveAttribute('src', imageUrl);
    expect(images[1]).toHaveAttribute('alt', defaultProps.userName);
  });

  it('shows "Upgrade to Pro" button for non-pro users', () => {
    render(<UserDropdown {...defaultProps} isProUser={false} />);

    const upgradeButton = screen.getByRole('button', {
      name: 'Upgrade to Pro',
    });
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).not.toBeDisabled();
  });

  it('shows "You are a Pro!" button (disabled) for pro users', () => {
    render(<UserDropdown {...defaultProps} isProUser={true} />);

    const proButton = screen.getByRole('button', { name: 'You are a Pro!' });
    expect(proButton).toBeInTheDocument();
    expect(proButton).toBeDisabled();
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
