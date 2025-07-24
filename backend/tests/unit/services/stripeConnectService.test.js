// Mock Stripe first before requiring the service
const mockStripe = {
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
  },
  charges: {
    create: jest.fn(),
  },
  transfers: {
    create: jest.fn(),
    list: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  balance: {
    retrieve: jest.fn(),
  },
  customers: {
    create: jest.fn(),
  },
  paymentMethods: {
    create: jest.fn(),
    attach: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});

const stripeConnectService = require('../../../services/stripeConnectService');

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('stripeConnectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
  });

  describe('createConnectedAccount', () => {
    const mockUserData = {
      id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      country: 'US'
    };

    it('should return mock data when using dummy API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'dummy_stripe_key';

      const result = await stripeConnectService.createConnectedAccount(mockUserData);

      expect(result).toBeDefined();
      expect(result.id).toContain('acct_mock');
      expect(result.email).toBe(mockUserData.email);
      expect(result.country).toBe(mockUserData.country);
      expect(result.metadata.userId).toBe(mockUserData.id);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockAccount = {
        id: 'acct_123',
        email: mockUserData.email,
        country: mockUserData.country
      };

      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      const result = await stripeConnectService.createConnectedAccount(mockUserData);

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        country: mockUserData.country,
        email: mockUserData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: mockUserData.username,
          url: `https://waifuhospital.com/creators/${mockUserData.id}`,
        },
        metadata: {
          userId: mockUserData.id,
        },
      });
      expect(result).toEqual(mockAccount);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should handle API errors and return mock data', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      mockStripe.accounts.create.mockRejectedValue(new Error('Stripe API error'));

      const result = await stripeConnectService.createConnectedAccount(mockUserData);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error creating Stripe connected account:',
        'Stripe API error'
      );
      expect(result).toBeDefined();
      expect(result.id).toContain('acct_mock');

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should use default values for missing user data', async () => {
      const minimalUserData = {
        id: 'user123',
        email: 'test@example.com'
      };

      const result = await stripeConnectService.createConnectedAccount(minimalUserData);

      expect(result.country).toBe('US'); // default
      expect(result.business_profile.url).toBe(`https://waifuhospital.com/creators/${minimalUserData.id}`);
    });
  });

  describe('createAccountLink', () => {
    const accountId = 'acct_123';
    const refreshUrl = 'https://example.com/refresh';
    const returnUrl = 'https://example.com/return';

    it('should return mock data when using dummy API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'dummy_stripe_key';

      const result = await stripeConnectService.createAccountLink(accountId, refreshUrl, returnUrl);

      expect(result).toBeDefined();
      expect(result.object).toBe('account_link');
      expect(result.url).toBe('https://connect.stripe.com/setup/mock');

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockAccountLink = {
        object: 'account_link',
        url: 'https://connect.stripe.com/setup/real',
        expires_at: 1234567890
      };

      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await stripeConnectService.createAccountLink(accountId, refreshUrl, returnUrl);

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      expect(result).toEqual(mockAccountLink);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('getAccountDetails', () => {
    const accountId = 'acct_123';

    it('should return mock data when using dummy API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'dummy_stripe_key';

      const result = await stripeConnectService.getAccountDetails(accountId);

      expect(result).toBeDefined();
      expect(result.id).toBe(accountId);
      expect(result.charges_enabled).toBe(true);
      expect(result.payouts_enabled).toBe(true);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockAccount = {
        id: accountId,
        charges_enabled: true,
        payouts_enabled: true
      };

      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await stripeConnectService.getAccountDetails(accountId);

      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith(accountId);
      expect(result).toEqual(mockAccount);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('updateConnectedAccount', () => {
    const accountId = 'acct_123';
    const updateData = {
      business_profile: {
        name: 'Updated Business Name'
      }
    };

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.updateConnectedAccount(accountId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(accountId);
      expect(result.business_profile.name).toBe(updateData.business_profile.name);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockUpdatedAccount = {
        id: accountId,
        business_profile: updateData.business_profile
      };

      mockStripe.accounts.update.mockResolvedValue(mockUpdatedAccount);

      const result = await stripeConnectService.updateConnectedAccount(accountId, updateData);

      expect(mockStripe.accounts.update).toHaveBeenCalledWith(accountId, updateData);
      expect(result).toEqual(mockUpdatedAccount);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('createPaymentIntentWithFee', () => {
    const mockPaymentData = {
      amount: 2000,
      currency: 'usd',
      description: 'Test payment',
      metadata: { orderId: 'order_123' }
    };
    const connectedAccountId = 'acct_123';
    const applicationFeePercent = 20;

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.createPaymentIntentWithFee(
        mockPaymentData,
        connectedAccountId,
        applicationFeePercent
      );

      expect(result).toBeDefined();
      expect(result.id).toContain('pi_mock');
      expect(result.amount).toBe(mockPaymentData.amount);
      expect(result.application_fee_amount).toBe(400); // 20% of 2000
      expect(result.transfer_data.destination).toBe(connectedAccountId);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockPaymentIntent = {
        id: 'pi_123',
        amount: mockPaymentData.amount,
        application_fee_amount: 400,
        transfer_data: { destination: connectedAccountId }
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeConnectService.createPaymentIntentWithFee(
        mockPaymentData,
        connectedAccountId,
        applicationFeePercent
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: mockPaymentData.amount,
        currency: mockPaymentData.currency,
        description: mockPaymentData.description,
        metadata: mockPaymentData.metadata,
        application_fee_amount: 400,
        customer: undefined,
        transfer_data: {
          destination: connectedAccountId,
        },
      });
      expect(result).toEqual(mockPaymentIntent);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should calculate application fee correctly for different percentages', async () => {
      const testCases = [
        { percent: 10, expectedFee: 200 },
        { percent: 15, expectedFee: 300 },
        { percent: 25, expectedFee: 500 },
      ];

      for (const testCase of testCases) {
        const result = await stripeConnectService.createPaymentIntentWithFee(
          mockPaymentData,
          connectedAccountId,
          testCase.percent
        );

        expect(result.application_fee_amount).toBe(testCase.expectedFee);
      }
    });
  });

  describe('createDirectChargeWithTransfer', () => {
    const mockChargeData = {
      amount: 1500,
      currency: 'usd',
      description: 'Test charge',
      source: 'tok_visa'
    };
    const connectedAccountId = 'acct_123';

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.createDirectChargeWithTransfer(
        mockChargeData,
        connectedAccountId
      );

      expect(result).toBeDefined();
      expect(result.id).toContain('ch_mock');
      expect(result.amount).toBe(mockChargeData.amount);
      expect(result.application_fee_amount).toBe(300); // 20% of 1500
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockCharge = {
        id: 'ch_123',
        amount: mockChargeData.amount,
        application_fee_amount: 300
      };

      mockStripe.charges.create.mockResolvedValue(mockCharge);

      const result = await stripeConnectService.createDirectChargeWithTransfer(
        mockChargeData,
        connectedAccountId
      );

      expect(mockStripe.charges.create).toHaveBeenCalledWith({
        amount: mockChargeData.amount,
        currency: mockChargeData.currency,
        description: mockChargeData.description,
        metadata: undefined,
        source: mockChargeData.source,
        customer: undefined,
        application_fee_amount: 300,
        transfer_data: {
          destination: connectedAccountId,
        },
      });
      expect(result).toEqual(mockCharge);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('transferToConnectedAccount', () => {
    const mockTransferData = {
      amount: 1000,
      currency: 'usd',
      description: 'Test transfer'
    };
    const connectedAccountId = 'acct_123';

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.transferToConnectedAccount(
        mockTransferData,
        connectedAccountId
      );

      expect(result).toBeDefined();
      expect(result.id).toContain('tr_mock');
      expect(result.amount).toBe(mockTransferData.amount);
      expect(result.destination).toBe(connectedAccountId);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockTransfer = {
        id: 'tr_123',
        amount: mockTransferData.amount,
        destination: connectedAccountId
      };

      mockStripe.transfers.create.mockResolvedValue(mockTransfer);

      const result = await stripeConnectService.transferToConnectedAccount(
        mockTransferData,
        connectedAccountId
      );

      expect(mockStripe.transfers.create).toHaveBeenCalledWith({
        amount: mockTransferData.amount,
        currency: mockTransferData.currency,
        destination: connectedAccountId,
        description: mockTransferData.description,
        metadata: undefined,
      });
      expect(result).toEqual(mockTransfer);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('createRefundWithFeeReversal', () => {
    const chargeId = 'ch_123';
    const mockRefundData = {
      amount: 500,
      reason: 'requested_by_customer',
      metadata: { refund_reason: 'defective' }
    };

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.createRefundWithFeeReversal(chargeId, mockRefundData);

      expect(result).toBeDefined();
      expect(result.id).toContain('re_mock');
      expect(result.charge).toBe(chargeId);
      expect(result.amount).toBe(mockRefundData.amount);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockRefund = {
        id: 're_123',
        charge: chargeId,
        amount: mockRefundData.amount
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeConnectService.createRefundWithFeeReversal(chargeId, mockRefundData);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        charge: chargeId,
        amount: mockRefundData.amount,
        reason: mockRefundData.reason,
        metadata: mockRefundData.metadata,
        reverse_transfer: true,
        refund_application_fee: true,
      });
      expect(result).toEqual(mockRefund);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should handle refund without optional data', async () => {
      const result = await stripeConnectService.createRefundWithFeeReversal(chargeId);

      expect(result).toBeDefined();
      expect(result.charge).toBe(chargeId);
      expect(result.amount).toBe(1000); // default amount from mock
    });
  });

  describe('getConnectedAccountBalance', () => {
    const connectedAccountId = 'acct_123';

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.getConnectedAccountBalance(connectedAccountId);

      expect(result).toBeDefined();
      expect(result.object).toBe('balance');
      expect(result.available).toHaveLength(1);
      expect(result.pending).toHaveLength(1);
      expect(result.available[0].amount).toBe(5000);
      expect(result.pending[0].amount).toBe(1000);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockBalance = {
        object: 'balance',
        available: [{ amount: 3000, currency: 'usd' }],
        pending: [{ amount: 500, currency: 'usd' }]
      };

      mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

      const result = await stripeConnectService.getConnectedAccountBalance(connectedAccountId);

      expect(mockStripe.balance.retrieve).toHaveBeenCalledWith({
        stripeAccount: connectedAccountId,
      });
      expect(result).toEqual(mockBalance);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('getConnectedAccountTransfers', () => {
    const connectedAccountId = 'acct_123';
    const options = { limit: 5, starting_after: 'tr_123' };

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.getConnectedAccountTransfers(connectedAccountId, options);

      expect(result).toBeDefined();
      expect(result.object).toBe('list');
      expect(result.data).toHaveLength(options.limit);
      expect(result.data[0].destination).toBe(connectedAccountId);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockTransfers = {
        object: 'list',
        data: [
          { id: 'tr_123', destination: connectedAccountId, amount: 1000 }
        ]
      };

      mockStripe.transfers.list.mockResolvedValue(mockTransfers);

      const result = await stripeConnectService.getConnectedAccountTransfers(connectedAccountId, options);

      expect(mockStripe.transfers.list).toHaveBeenCalledWith({
        destination: connectedAccountId,
        limit: options.limit,
        starting_after: options.starting_after,
        ending_before: undefined,
      });
      expect(result).toEqual(mockTransfers);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should use default options when none provided', async () => {
      const result = await stripeConnectService.getConnectedAccountTransfers(connectedAccountId);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(10); // default limit
    });
  });

  describe('createCustomer', () => {
    const mockCustomerData = {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: '+1234567890',
      metadata: { userId: 'user123' }
    };

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.createCustomer(mockCustomerData);

      expect(result).toBeDefined();
      expect(result.id).toContain('cus_mock');
      expect(result.email).toBe(mockCustomerData.email);
      expect(result.name).toBe(mockCustomerData.name);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockCustomer = {
        id: 'cus_123',
        email: mockCustomerData.email,
        name: mockCustomerData.name
      };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const result = await stripeConnectService.createCustomer(mockCustomerData);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: mockCustomerData.email,
        name: mockCustomerData.name,
        metadata: mockCustomerData.metadata,
        phone: mockCustomerData.phone,
      });
      expect(result).toEqual(mockCustomer);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('createPaymentMethod', () => {
    const mockPaymentMethodData = {
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      }
    };

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.createPaymentMethod(mockPaymentMethodData);

      expect(result).toBeDefined();
      expect(result.id).toContain('pm_mock');
      expect(result.type).toBe('card');
      expect(result.card.last4).toBe('4242');
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockPaymentMethod = {
        id: 'pm_123',
        type: 'card',
        card: { last4: '4242' }
      };

      mockStripe.paymentMethods.create.mockResolvedValue(mockPaymentMethod);

      const result = await stripeConnectService.createPaymentMethod(mockPaymentMethodData);

      expect(mockStripe.paymentMethods.create).toHaveBeenCalledWith({
        type: mockPaymentMethodData.type,
        card: mockPaymentMethodData.card,
        billing_details: undefined,
      });
      expect(result).toEqual(mockPaymentMethod);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('attachPaymentMethodToCustomer', () => {
    const paymentMethodId = 'pm_123';
    const customerId = 'cus_123';

    it('should return mock data when using dummy API key', async () => {
      const result = await stripeConnectService.attachPaymentMethodToCustomer(paymentMethodId, customerId);

      expect(result).toBeDefined();
      expect(result.id).toBe(paymentMethodId);
      expect(result.customer).toBe(customerId);
    });

    it('should call Stripe API with real API key', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockPaymentMethod = {
        id: paymentMethodId,
        customer: customerId
      };

      mockStripe.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);

      const result = await stripeConnectService.attachPaymentMethodToCustomer(paymentMethodId, customerId);

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(paymentMethodId, {
        customer: customerId,
      });
      expect(result).toEqual(mockPaymentMethod);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('constructWebhookEvent', () => {
    const mockBody = '{"type":"payment_intent.succeeded","data":{"object":{}}}';
    const mockSignature = 'whsec_test_signature';
    const mockEndpointSecret = 'whsec_test_secret';

    it('should return mock event when using dummy API key', () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'dummy_stripe_key';

      const result = stripeConnectService.constructWebhookEvent(mockBody, mockSignature, mockEndpointSecret);

      expect(result).toBeDefined();
      expect(result.id).toContain('evt_mock');
      expect(result.object).toBe('event');
      expect(result.type).toBe('payment_intent.succeeded');

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should call Stripe API with real API key', () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const mockEvent = {
        id: 'evt_123',
        object: 'event',
        type: 'payment_intent.succeeded'
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = stripeConnectService.constructWebhookEvent(mockBody, mockSignature, mockEndpointSecret);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockBody,
        mockSignature,
        mockEndpointSecret
      );
      expect(result).toEqual(mockEvent);

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should throw error on webhook construction failure', () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      const error = new Error('Invalid signature');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        stripeConnectService.constructWebhookEvent('invalid', 'invalid', 'invalid');
      }).toThrow('Invalid signature');

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should handle malformed JSON in webhook body', () => {
      const malformedBody = 'invalid json';
      
      const result = stripeConnectService.constructWebhookEvent(malformedBody, mockSignature, mockEndpointSecret);

      expect(result).toBeDefined();
      expect(result.type).toBe('unknown');
    });
  });

  describe('error handling', () => {
    it('should handle all service methods gracefully when API fails', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      // Mock all Stripe methods to fail
      Object.values(mockStripe).forEach(service => {
        if (typeof service === 'object') {
          Object.values(service).forEach(method => {
            if (typeof method === 'function') {
              method.mockRejectedValue(new Error('API Error'));
            }
          });
        }
      });

      // Test that all methods still return data (mock fallbacks)
      const userData = { id: 'user', email: 'test@example.com' };
      const accountResult = await stripeConnectService.createConnectedAccount(userData);
      expect(accountResult).toBeDefined();

      const linkResult = await stripeConnectService.createAccountLink('acct_123', 'refresh', 'return');
      expect(linkResult).toBeDefined();

      const detailsResult = await stripeConnectService.getAccountDetails('acct_123');
      expect(detailsResult).toBeDefined();

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it('should log errors appropriately', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_real_key';

      mockStripe.accounts.create.mockRejectedValue(new Error('Test error'));

      await stripeConnectService.createConnectedAccount({ id: 'test', email: 'test@example.com' });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error creating Stripe connected account:',
        'Test error'
      );

      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('mock data quality', () => {
    it('should generate consistent mock IDs', async () => {
      const result1 = await stripeConnectService.createConnectedAccount({ id: 'user1', email: 'test1@example.com' });
      const result2 = await stripeConnectService.createConnectedAccount({ id: 'user2', email: 'test2@example.com' });

      expect(result1.id).toContain('acct_mock');
      expect(result2.id).toContain('acct_mock');
      expect(result1.id).not.toBe(result2.id);
    });

    it('should generate realistic mock data structures', async () => {
      const balance = await stripeConnectService.getConnectedAccountBalance('acct_123');

      expect(balance).toMatchObject({
        object: 'balance',
        available: expect.arrayContaining([
          expect.objectContaining({
            amount: expect.any(Number),
            currency: expect.any(String),
            source_types: expect.any(Object)
          })
        ]),
        pending: expect.arrayContaining([
          expect.objectContaining({
            amount: expect.any(Number),
            currency: expect.any(String)
          })
        ])
      });
    });
  });
});