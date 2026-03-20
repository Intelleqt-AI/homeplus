// Mock data for demo mode
// This file contains dummy data used when VITE_DEMO_MODE is "true"

export const isDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true';

// Demo user credentials
export const DEMO_CREDENTIALS = {
  email: 'demo@homeplus.com',
  password: 'demo123',
};

// Mock user object
export const mockUser = {
  id: 'demo-user-123',
  email: 'risalat@homeplus.com',
  user_metadata: {
    full_name: 'Risalat Shahriar',
    first_name: 'Risalat',
    last_name: 'Shahriar',
    location: 'London',
    postcode: 'SW1A 1AA',
    property_type: 'Detached House',
  },
  created_at: '2024-01-15T10:00:00Z',
};

// Mock session object
export const mockSession = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_at: Date.now() + 3600000,
  user: mockUser,
};

// Mock property data
export const mockProperty = {
  id: 'prop-001',
  user_id: 'demo-user-123',
  address: '14 Oak Lane, London, SW1A 1AA',
  type: 'Detached House',
  bedrooms: 4,
  bathrooms: 2,
  role: 'Homeowner',
  created_at: '2024-01-15T10:00:00Z',
};

// Mock events/tasks
export const mockEvents = [
  {
    id: 'event-001',
    title: 'Car Tax Renewal',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    time: '09:00',
    eventType: 'Vehicle',
    type: 'reminder',
    priority: 'high',
    cost: 165,
    recurring: 'yearly',
    description: 'Vehicle tax due for renewal',
  },
  {
    id: 'event-002',
    title: 'Boiler Service',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    time: '10:00',
    eventType: 'Maintenance',
    type: 'service',
    priority: 'medium',
    cost: 85,
    recurring: 'yearly',
    isRequireTrade: true,
    description: 'Annual boiler service and safety check',
  },
  {
    id: 'event-003',
    title: 'Black Bin Collection',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    time: '07:00',
    eventType: 'Household',
    type: 'reminder',
    priority: 'low',
    recurring: 'weekly',
    description: 'Put bins out the night before',
  },
  {
    id: 'event-004',
    title: 'Home Insurance Renewal',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
    time: '12:00',
    eventType: 'Insurance',
    type: 'compliance',
    priority: 'high',
    cost: 342,
    recurring: 'yearly',
    description: 'Buildings and contents insurance renewal',
  },
  {
    id: 'event-005',
    title: 'Garden Maintenance',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    time: '14:00',
    eventType: 'Maintenance',
    type: 'service',
    priority: 'medium',
    cost: 150,
    recurring: 'quarterly',
    isRequireTrade: true,
    description: 'Lawn mowing, hedge trimming, and general tidy up',
  },
  {
    id: 'event-006',
    title: "Sarah's Birthday",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 6 weeks from now
    time: '18:00',
    eventType: 'Personal',
    type: 'reminder',
    priority: 'medium',
    description: 'Remember to get a gift!',
  },
];

// Mock documents
export const mockDocuments = [
  {
    id: 'doc-001',
    name: 'Home Insurance Certificate 2024',
    metadata: {
      createdAt: '2024-03-15T10:30:00Z',
      metadata: {
        type: 'Insurance',
        category: 'home',
        status: '2025-03-15',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-002',
    name: 'Building Regulations Certificate',
    metadata: {
      createdAt: '2023-08-22T14:15:00Z',
      metadata: {
        type: 'Compliance',
        category: 'home',
        status: null,
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-003',
    name: 'Car Insurance Policy',
    metadata: {
      createdAt: '2024-01-10T09:00:00Z',
      metadata: {
        type: 'Insurance',
        category: 'car',
        status: '2025-01-10',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-004',
    name: 'Fridge Freezer Warranty',
    metadata: {
      createdAt: '2022-11-05T16:45:00Z',
      metadata: {
        type: 'Warranty',
        category: 'warranties',
        status: '2024-11-05',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-005',
    name: 'Washing Machine Receipt',
    metadata: {
      createdAt: '2023-06-18T11:20:00Z',
      metadata: {
        type: 'Receipt',
        category: 'miscellaneous',
        status: null,
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-006',
    name: 'MOT Certificate',
    metadata: {
      createdAt: '2024-02-20T10:00:00Z',
      metadata: {
        type: 'Certificate',
        category: 'car',
        status: '2025-02-20',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-007',
    name: 'Boiler Warranty',
    metadata: {
      createdAt: '2023-01-15T09:30:00Z',
      metadata: {
        type: 'Warranty',
        category: 'warranties',
        status: '2028-01-15',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-008',
    name: 'EPC Certificate',
    metadata: {
      createdAt: '2023-05-10T14:00:00Z',
      metadata: {
        type: 'Certificate',
        category: 'home',
        status: '2033-05-10',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-009',
    name: 'Gas Safety Certificate CP12',
    metadata: {
      createdAt: '2024-06-01T11:00:00Z',
      metadata: {
        type: 'Certificate',
        category: 'home',
        status: '2025-06-01',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-010',
    name: 'EICR Report',
    metadata: {
      createdAt: '2023-09-15T14:30:00Z',
      metadata: {
        type: 'Compliance',
        category: 'home',
        status: '2028-09-15',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-011',
    name: 'TV Warranty',
    metadata: {
      createdAt: '2024-01-20T10:00:00Z',
      metadata: {
        type: 'Warranty',
        category: 'warranties',
        status: '2027-01-20',
      },
    },
    publicUrl: '#',
  },
  {
    id: 'doc-012',
    name: 'Driving Licence',
    metadata: {
      createdAt: '2020-05-15T09:00:00Z',
      metadata: {
        type: 'ID',
        category: 'car',
        status: '2030-05-15',
      },
    },
    publicUrl: '#',
  },
];

// Mock job leads with bids
export const mockLeads = [
  {
    id: 'lead-001',
    name: 'Boiler Repair',
    service: 'Plumbing',
    location: 'London SW1A',
    value: '£150-300',
    homeID: 'demo-user-123',
    isApproved: false,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [
      {
        id: 'bid-001',
        proposedValue: 180,
        status: 'pending',
        Available: 'This week',
        bidder: {
          first_name: 'Mike',
          last_name: 'Thompson',
          email: 'mike@plumbingpros.co.uk',
        },
      },
      {
        id: 'bid-002',
        proposedValue: 220,
        status: 'pending',
        Available: 'Tomorrow',
        bidder: {
          first_name: 'Sarah',
          last_name: 'Williams',
          email: 'sarah@quickfix.com',
        },
      },
      {
        id: 'bid-003',
        proposedValue: 165,
        status: 'pending',
        Available: 'Next week',
        bidder: {
          first_name: 'James',
          last_name: 'Brown',
          email: 'james@heatingexperts.co.uk',
        },
      },
    ],
  },
  {
    id: 'lead-002',
    name: 'Gutter Cleaning',
    service: 'Exterior Maintenance',
    location: 'London SW1A',
    value: '£80-150',
    homeID: 'demo-user-123',
    isApproved: false,
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [
      {
        id: 'bid-004',
        proposedValue: 95,
        status: 'pending',
        Available: 'This weekend',
        bidder: {
          first_name: 'Tom',
          last_name: 'Harris',
          email: 'tom@cleanservices.co.uk',
        },
      },
    ],
  },
  {
    id: 'lead-003',
    name: 'Electrical Inspection',
    service: 'Electrical',
    location: 'London SW1A',
    value: '£200-400',
    homeID: 'demo-user-123',
    isApproved: true,
    updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [
      {
        id: 'bid-005',
        proposedValue: 275,
        status: 'accepted',
        Available: 'Completed',
        bidder: {
          first_name: 'David',
          last_name: 'Clarke',
          email: 'david@sparkelectrical.co.uk',
        },
      },
    ],
  },
  {
    id: 'lead-004',
    name: 'Garden Landscaping',
    service: 'Gardening',
    location: 'London SW1A',
    value: '£500-1000',
    homeID: 'demo-user-123',
    isApproved: false,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [],
  },
];

// Mock cover image
export const mockCover = [
  {
    id: 'cover-001',
    name: 'cover.jpg',
    publicUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60',
    metadata: {
      mimetype: 'image/jpeg',
    },
  },
];
