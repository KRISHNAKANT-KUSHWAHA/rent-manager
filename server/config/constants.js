module.exports = {
  HOUSE_INFO: {
    name: 'Shanti Niwas (Property #104)',
    address: 'Plot 42, Green Avenue, Sector 15, Near City Park',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302020',
    totalFloors: 2,
    defaultElectricityRate: 9.5, // INR per unit
    currency: 'INR',
    currencySymbol: '₹'
  },
  ROOM_STATUS: {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    MAINTENANCE: 'Maintenance'
  },
  ELECTRICITY_BILLING_TYPES: {
    SUBMETER: 'submeter',
    FIXED: 'fixed',
    PER_UNIT: 'per_unit',
    SHARED: 'shared'
  },
  TENANT_STATUS: {
    ACTIVE: 'Active',
    VACATED: 'Vacated',
    INACTIVE: 'Inactive'
  },
  AGREEMENT_STATUS: {
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    TERMINATED: 'Terminated',
    RENEWED: 'Renewed'
  },
  PAYMENT_STATUS: {
    PENDING: 'Pending',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
    OVERDUE: 'Overdue'
  },
  PAYMENT_METHODS: {
    CASH: 'Cash',
    UPI: 'UPI',
    BANK_TRANSFER: 'Bank Transfer',
    OTHER: 'Other'
  },
  DOCUMENT_TYPES: {
    AADHAAR: 'aadhaar',
    VOTER_ID: 'voter_id',
    PAN: 'pan',
    PHOTO: 'photo',
    ADDRESS_PROOF: 'address_proof',
    RENTAL_AGREEMENT: 'agreement',
    POLICE_VERIFICATION: 'police_verification',
    OTHER: 'other'
  },
  EXPENSE_CATEGORIES: [
    'Plumbing',
    'Electrical',
    'Painting',
    'Cleaning',
    'Maintenance',
    'Taxes',
    'Pest Control',
    'Security',
    'Renovation',
    'Other'
  ]
};

