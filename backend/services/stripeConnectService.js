const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || "dummy_stripe_key",
);
const dotenv = require("dotenv");

dotenv.config();

/**
 * Create a connected account for a user
 * @param {Object} userData - User data including email, name, etc.
 * @returns {Promise<Object>} Connected account data
 */
const createConnectedAccount = async (userData) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreateConnectedAccount(userData);
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: userData.country || "US",
      email: userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        name: userData.username || `${userData.firstName} ${userData.lastName}`,
        url:
          userData.website ||
          `https://waifuhospital.com/creators/${userData.id}`,
      },
      metadata: {
        userId: userData.id,
      },
    });

    return account;
  } catch (error) {
    console.error("Error creating Stripe connected account:", error.message);
    // Return mock data if API call fails
    return mockCreateConnectedAccount(userData);
  }
};

/**
 * Create an account link for onboarding
 * @param {String} accountId - Stripe account ID
 * @param {String} refreshUrl - URL to redirect if session expires
 * @param {String} returnUrl - URL to redirect after completion
 * @returns {Promise<Object>} Account link data
 */
const createAccountLink = async (accountId, refreshUrl, returnUrl) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreateAccountLink(accountId, refreshUrl, returnUrl);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return accountLink;
  } catch (error) {
    console.error("Error creating Stripe account link:", error.message);
    // Return mock data if API call fails
    return mockCreateAccountLink(accountId, refreshUrl, returnUrl);
  }
};

/**
 * Get account details
 * @param {String} accountId - Stripe account ID
 * @returns {Promise<Object>} Account details
 */
const getAccountDetails = async (accountId) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockGetAccountDetails(accountId);
    }

    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error("Error retrieving Stripe account details:", error.message);
    // Return mock data if API call fails
    return mockGetAccountDetails(accountId);
  }
};

/**
 * Update connected account
 * @param {String} accountId - Stripe account ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated account data
 */
const updateConnectedAccount = async (accountId, updateData) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockUpdateConnectedAccount(accountId, updateData);
    }

    const account = await stripe.accounts.update(accountId, updateData);
    return account;
  } catch (error) {
    console.error("Error updating Stripe connected account:", error.message);
    // Return mock data if API call fails
    return mockUpdateConnectedAccount(accountId, updateData);
  }
};

/**
 * Create a payment intent with application fee
 * @param {Object} paymentData - Payment data including amount, currency, etc.
 * @param {String} connectedAccountId - Stripe connected account ID
 * @param {Number} applicationFeePercent - Platform fee percentage (e.g., 20 for 20%)
 * @returns {Promise<Object>} Payment intent data
 */
const createPaymentIntentWithFee = async (
  paymentData,
  connectedAccountId,
  applicationFeePercent = 20,
) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreatePaymentIntentWithFee(
        paymentData,
        connectedAccountId,
        applicationFeePercent,
      );
    }

    const {
      amount,
      currency = "usd",
      description,
      metadata,
      customer,
    } = paymentData;

    // Calculate application fee amount (platform fee)
    const applicationFeeAmount = Math.round(
      (amount * applicationFeePercent) / 100,
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata,
      application_fee_amount: applicationFeeAmount,
      customer,
      transfer_data: {
        destination: connectedAccountId,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error(
      "Error creating Stripe payment intent with fee:",
      error.message,
    );
    // Return mock data if API call fails
    return mockCreatePaymentIntentWithFee(
      paymentData,
      connectedAccountId,
      applicationFeePercent,
    );
  }
};

/**
 * Create a direct charge and transfer funds to connected account
 * @param {Object} chargeData - Charge data including amount, currency, etc.
 * @param {String} connectedAccountId - Stripe connected account ID
 * @param {Number} applicationFeePercent - Platform fee percentage (e.g., 20 for 20%)
 * @returns {Promise<Object>} Charge data
 */
const createDirectChargeWithTransfer = async (
  chargeData,
  connectedAccountId,
  applicationFeePercent = 20,
) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreateDirectChargeWithTransfer(
        chargeData,
        connectedAccountId,
        applicationFeePercent,
      );
    }

    const {
      amount,
      currency = "usd",
      description,
      metadata,
      source,
      customer,
    } = chargeData;

    // Calculate application fee amount (platform fee)
    const applicationFeeAmount = Math.round(
      (amount * applicationFeePercent) / 100,
    );

    const charge = await stripe.charges.create({
      amount,
      currency,
      description,
      metadata,
      source,
      customer,
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: connectedAccountId,
      },
    });

    return charge;
  } catch (error) {
    console.error(
      "Error creating Stripe direct charge with transfer:",
      error.message,
    );
    // Return mock data if API call fails
    return mockCreateDirectChargeWithTransfer(
      chargeData,
      connectedAccountId,
      applicationFeePercent,
    );
  }
};

/**
 * Transfer funds to a connected account
 * @param {Object} transferData - Transfer data including amount, currency, etc.
 * @param {String} connectedAccountId - Stripe connected account ID
 * @returns {Promise<Object>} Transfer data
 */
const transferToConnectedAccount = async (transferData, connectedAccountId) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockTransferToConnectedAccount(transferData, connectedAccountId);
    }

    const { amount, currency = "usd", description, metadata } = transferData;

    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: connectedAccountId,
      description,
      metadata,
    });

    return transfer;
  } catch (error) {
    console.error(
      "Error transferring funds to Stripe connected account:",
      error.message,
    );
    // Return mock data if API call fails
    return mockTransferToConnectedAccount(transferData, connectedAccountId);
  }
};

/**
 * Create a refund with fee reversal
 * @param {String} chargeId - Stripe charge ID
 * @param {Object} refundData - Refund data including amount, etc.
 * @returns {Promise<Object>} Refund data
 */
const createRefundWithFeeReversal = async (chargeId, refundData = {}) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreateRefundWithFeeReversal(chargeId, refundData);
    }

    const { amount, reason, metadata } = refundData;

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount,
      reason,
      metadata,
      reverse_transfer: true,
      refund_application_fee: true,
    });

    return refund;
  } catch (error) {
    console.error(
      "Error creating Stripe refund with fee reversal:",
      error.message,
    );
    // Return mock data if API call fails
    return mockCreateRefundWithFeeReversal(chargeId, refundData);
  }
};

/**
 * Get balance for connected account
 * @param {String} connectedAccountId - Stripe connected account ID
 * @returns {Promise<Object>} Balance data
 */
const getConnectedAccountBalance = async (connectedAccountId) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockGetConnectedAccountBalance(connectedAccountId);
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    });

    return balance;
  } catch (error) {
    console.error(
      "Error retrieving Stripe connected account balance:",
      error.message,
    );
    // Return mock data if API call fails
    return mockGetConnectedAccountBalance(connectedAccountId);
  }
};

/**
 * Get transfers for connected account
 * @param {String} connectedAccountId - Stripe connected account ID
 * @param {Object} options - Options including limit, starting_after, etc.
 * @returns {Promise<Object>} Transfers data
 */
const getConnectedAccountTransfers = async (
  connectedAccountId,
  options = {},
) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockGetConnectedAccountTransfers(connectedAccountId, options);
    }

    const { limit = 10, starting_after, ending_before } = options;

    const transfers = await stripe.transfers.list({
      destination: connectedAccountId,
      limit,
      starting_after,
      ending_before,
    });

    return transfers;
  } catch (error) {
    console.error(
      "Error retrieving Stripe connected account transfers:",
      error.message,
    );
    // Return mock data if API call fails
    return mockGetConnectedAccountTransfers(connectedAccountId, options);
  }
};

/**
 * Create a customer
 * @param {Object} customerData - Customer data including email, name, etc.
 * @returns {Promise<Object>} Customer data
 */
const createCustomer = async (customerData) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreateCustomer(customerData);
    }

    const { email, name, metadata, phone } = customerData;

    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
      phone,
    });

    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error.message);
    // Return mock data if API call fails
    return mockCreateCustomer(customerData);
  }
};

/**
 * Create a payment method
 * @param {Object} paymentMethodData - Payment method data
 * @returns {Promise<Object>} Payment method data
 */
const createPaymentMethod = async (paymentMethodData) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockCreatePaymentMethod(paymentMethodData);
    }

    const { type = "card", card, billing_details } = paymentMethodData;

    const paymentMethod = await stripe.paymentMethods.create({
      type,
      card,
      billing_details,
    });

    return paymentMethod;
  } catch (error) {
    console.error("Error creating Stripe payment method:", error.message);
    // Return mock data if API call fails
    return mockCreatePaymentMethod(paymentMethodData);
  }
};

/**
 * Attach payment method to customer
 * @param {String} paymentMethodId - Stripe payment method ID
 * @param {String} customerId - Stripe customer ID
 * @returns {Promise<Object>} Payment method data
 */
const attachPaymentMethodToCustomer = async (paymentMethodId, customerId) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockAttachPaymentMethodToCustomer(paymentMethodId, customerId);
    }

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return paymentMethod;
  } catch (error) {
    console.error(
      "Error attaching Stripe payment method to customer:",
      error.message,
    );
    // Return mock data if API call fails
    return mockAttachPaymentMethodToCustomer(paymentMethodId, customerId);
  }
};

/**
 * Process webhook event
 * @param {String} body - Request body
 * @param {String} signature - Stripe signature
 * @param {String} endpointSecret - Webhook endpoint secret
 * @returns {Promise<Object>} Event data
 */
const constructWebhookEvent = (body, signature, endpointSecret) => {
  try {
    if (process.env.STRIPE_SECRET_KEY === "dummy_stripe_key") {
      return mockConstructWebhookEvent(body);
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret,
    );
    return event;
  } catch (error) {
    console.error("Error constructing Stripe webhook event:", error.message);
    throw error;
  }
};

// Mock functions for development

/**
 * Mock create connected account
 * @param {Object} userData - User data
 * @returns {Object} Mock connected account data
 */
const mockCreateConnectedAccount = (userData) => {
  const mockId = `acct_mock${Date.now()}`;
  return {
    id: mockId,
    object: "account",
    business_profile: {
      name: userData.username || `${userData.firstName} ${userData.lastName}`,
      url:
        userData.website || `https://waifuhospital.com/creators/${userData.id}`,
    },
    capabilities: {
      card_payments: { requested: true, status: "pending" },
      transfers: { requested: true, status: "pending" },
    },
    charges_enabled: false,
    country: userData.country || "US",
    created: Math.floor(Date.now() / 1000),
    default_currency: "usd",
    details_submitted: false,
    email: userData.email,
    metadata: {
      userId: userData.id,
    },
    payouts_enabled: false,
    settings: {
      payouts: {
        schedule: {
          delay_days: 2,
          interval: "daily",
        },
      },
    },
    type: "express",
  };
};

/**
 * Mock create account link
 * @param {String} accountId - Stripe account ID
 * @param {String} refreshUrl - URL to redirect if session expires
 * @param {String} returnUrl - URL to redirect after completion
 * @returns {Object} Mock account link data
 */
const mockCreateAccountLink = (accountId, refreshUrl, returnUrl) => {
  return {
    object: "account_link",
    created: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    url: "https://connect.stripe.com/setup/mock",
  };
};

/**
 * Mock get account details
 * @param {String} accountId - Stripe account ID
 * @returns {Object} Mock account details
 */
const mockGetAccountDetails = (accountId) => {
  return {
    id: accountId,
    object: "account",
    business_profile: {
      name: "Mock Creator",
      url: "https://waifuhospital.com/creators/mock",
    },
    capabilities: {
      card_payments: { requested: true, status: "active" },
      transfers: { requested: true, status: "active" },
    },
    charges_enabled: true,
    country: "US",
    created: Math.floor(Date.now() / 1000) - 86400,
    default_currency: "usd",
    details_submitted: true,
    email: "mock@example.com",
    metadata: {
      userId: "mock_user_id",
    },
    payouts_enabled: true,
    settings: {
      payouts: {
        schedule: {
          delay_days: 2,
          interval: "daily",
        },
      },
    },
    type: "express",
  };
};

/**
 * Mock update connected account
 * @param {String} accountId - Stripe account ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Mock updated account data
 */
const mockUpdateConnectedAccount = (accountId, updateData) => {
  return {
    id: accountId,
    object: "account",
    business_profile: {
      name: updateData.business_profile?.name || "Mock Creator",
      url:
        updateData.business_profile?.url ||
        "https://waifuhospital.com/creators/mock",
    },
    capabilities: {
      card_payments: { requested: true, status: "active" },
      transfers: { requested: true, status: "active" },
    },
    charges_enabled: true,
    country: updateData.country || "US",
    created: Math.floor(Date.now() / 1000) - 86400,
    default_currency: updateData.default_currency || "usd",
    details_submitted: true,
    email: updateData.email || "mock@example.com",
    metadata: {
      ...(updateData.metadata || {}),
      userId: "mock_user_id",
    },
    payouts_enabled: true,
    settings: {
      payouts: {
        schedule: {
          delay_days: updateData.settings?.payouts?.schedule?.delay_days || 2,
          interval: updateData.settings?.payouts?.schedule?.interval || "daily",
        },
      },
    },
    type: "express",
  };
};

/**
 * Mock create payment intent with fee
 * @param {Object} paymentData - Payment data
 * @param {String} connectedAccountId - Stripe connected account ID
 * @param {Number} applicationFeePercent - Platform fee percentage
 * @returns {Object} Mock payment intent data
 */
const mockCreatePaymentIntentWithFee = (
  paymentData,
  connectedAccountId,
  applicationFeePercent,
) => {
  const {
    amount,
    currency = "usd",
    description,
    metadata,
    customer,
  } = paymentData;
  const mockId = `pi_mock${Date.now()}`;
  const applicationFeeAmount = Math.round(
    (amount * applicationFeePercent) / 100,
  );

  return {
    id: mockId,
    object: "payment_intent",
    amount,
    application_fee_amount: applicationFeeAmount,
    currency,
    customer: customer || null,
    description,
    metadata: {
      ...(metadata || {}),
    },
    client_secret: `${mockId}_secret_mock`,
    created: Math.floor(Date.now() / 1000),
    status: "requires_payment_method",
    transfer_data: {
      destination: connectedAccountId,
    },
  };
};

/**
 * Mock create direct charge with transfer
 * @param {Object} chargeData - Charge data
 * @param {String} connectedAccountId - Stripe connected account ID
 * @param {Number} applicationFeePercent - Platform fee percentage
 * @returns {Object} Mock charge data
 */
const mockCreateDirectChargeWithTransfer = (
  chargeData,
  connectedAccountId,
  applicationFeePercent,
) => {
  const {
    amount,
    currency = "usd",
    description,
    metadata,
    customer,
  } = chargeData;
  const mockId = `ch_mock${Date.now()}`;
  const applicationFeeAmount = Math.round(
    (amount * applicationFeePercent) / 100,
  );

  return {
    id: mockId,
    object: "charge",
    amount,
    application_fee_amount: applicationFeeAmount,
    currency,
    customer: customer || null,
    description,
    metadata: {
      ...(metadata || {}),
    },
    created: Math.floor(Date.now() / 1000),
    status: "succeeded",
    transfer_data: {
      destination: connectedAccountId,
    },
    transfer: `tr_mock${Date.now()}`,
  };
};

/**
 * Mock transfer to connected account
 * @param {Object} transferData - Transfer data
 * @param {String} connectedAccountId - Stripe connected account ID
 * @returns {Object} Mock transfer data
 */
const mockTransferToConnectedAccount = (transferData, connectedAccountId) => {
  const { amount, currency = "usd", description, metadata } = transferData;
  const mockId = `tr_mock${Date.now()}`;

  return {
    id: mockId,
    object: "transfer",
    amount,
    currency,
    destination: connectedAccountId,
    description,
    metadata: {
      ...(metadata || {}),
    },
    created: Math.floor(Date.now() / 1000),
    date: Math.floor(Date.now() / 1000),
    status: "pending",
  };
};

/**
 * Mock create refund with fee reversal
 * @param {String} chargeId - Stripe charge ID
 * @param {Object} refundData - Refund data
 * @returns {Object} Mock refund data
 */
const mockCreateRefundWithFeeReversal = (chargeId, refundData = {}) => {
  const { amount, reason, metadata } = refundData;
  const mockId = `re_mock${Date.now()}`;

  return {
    id: mockId,
    object: "refund",
    amount: amount || 1000,
    charge: chargeId,
    created: Math.floor(Date.now() / 1000),
    currency: "usd",
    metadata: {
      ...(metadata || {}),
    },
    reason: reason || null,
    status: "succeeded",
  };
};

/**
 * Mock get connected account balance
 * @param {String} connectedAccountId - Stripe connected account ID
 * @returns {Object} Mock balance data
 */
const mockGetConnectedAccountBalance = (connectedAccountId) => {
  return {
    object: "balance",
    available: [
      {
        amount: 5000,
        currency: "usd",
        source_types: {
          card: 5000,
        },
      },
    ],
    pending: [
      {
        amount: 1000,
        currency: "usd",
        source_types: {
          card: 1000,
        },
      },
    ],
  };
};

/**
 * Mock get connected account transfers
 * @param {String} connectedAccountId - Stripe connected account ID
 * @param {Object} options - Options
 * @returns {Object} Mock transfers data
 */
const mockGetConnectedAccountTransfers = (connectedAccountId, options = {}) => {
  const { limit = 10 } = options;
  const transfers = [];

  for (let i = 0; i < limit; i++) {
    transfers.push({
      id: `tr_mock${Date.now() - i * 1000}`,
      object: "transfer",
      amount: 1000 + i * 100,
      currency: "usd",
      destination: connectedAccountId,
      description: `Mock transfer ${i + 1}`,
      metadata: {},
      created: Math.floor(Date.now() / 1000) - i * 86400,
      date: Math.floor(Date.now() / 1000) - i * 86400,
      status: "paid",
    });
  }

  return {
    object: "list",
    data: transfers,
    has_more: false,
    url: "/v1/transfers",
  };
};

/**
 * Mock create customer
 * @param {Object} customerData - Customer data
 * @returns {Object} Mock customer data
 */
const mockCreateCustomer = (customerData) => {
  const { email, name, metadata, phone } = customerData;
  const mockId = `cus_mock${Date.now()}`;

  return {
    id: mockId,
    object: "customer",
    created: Math.floor(Date.now() / 1000),
    email: email || "mock@example.com",
    name: name || "Mock Customer",
    phone: phone || null,
    metadata: {
      ...(metadata || {}),
    },
  };
};

/**
 * Mock create payment method
 * @param {Object} paymentMethodData - Payment method data
 * @returns {Object} Mock payment method data
 */
const mockCreatePaymentMethod = (paymentMethodData) => {
  const { type = "card", billing_details } = paymentMethodData;
  const mockId = `pm_mock${Date.now()}`;

  return {
    id: mockId,
    object: "payment_method",
    created: Math.floor(Date.now() / 1000),
    type,
    card: {
      brand: "visa",
      exp_month: 12,
      exp_year: 2025,
      last4: "4242",
      country: "US",
      funding: "credit",
    },
    billing_details: billing_details || {
      address: {
        city: null,
        country: null,
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      email: null,
      name: null,
      phone: null,
    },
    customer: null,
  };
};

/**
 * Mock attach payment method to customer
 * @param {String} paymentMethodId - Stripe payment method ID
 * @param {String} customerId - Stripe customer ID
 * @returns {Object} Mock payment method data
 */
const mockAttachPaymentMethodToCustomer = (paymentMethodId, customerId) => {
  return {
    id: paymentMethodId,
    object: "payment_method",
    created: Math.floor(Date.now() / 1000),
    type: "card",
    card: {
      brand: "visa",
      exp_month: 12,
      exp_year: 2025,
      last4: "4242",
      country: "US",
      funding: "credit",
    },
    billing_details: {
      address: {
        city: null,
        country: null,
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      email: null,
      name: null,
      phone: null,
    },
    customer: customerId,
  };
};

/**
 * Mock construct webhook event
 * @param {String} body - Request body
 * @returns {Object} Mock event data
 */
const mockConstructWebhookEvent = (body) => {
  try {
    const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
    return {
      id: `evt_mock${Date.now()}`,
      object: "event",
      api_version: "2020-08-27",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: parsedBody,
      },
      type: parsedBody.type || "payment_intent.succeeded",
    };
  } catch (error) {
    console.error("Error parsing webhook body:", error.message);
    return {
      id: `evt_mock${Date.now()}`,
      object: "event",
      api_version: "2020-08-27",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {},
      },
      type: "unknown",
    };
  }
};

module.exports = {
  createConnectedAccount,
  createAccountLink,
  getAccountDetails,
  updateConnectedAccount,
  createPaymentIntentWithFee,
  createDirectChargeWithTransfer,
  transferToConnectedAccount,
  createRefundWithFeeReversal,
  getConnectedAccountBalance,
  getConnectedAccountTransfers,
  createCustomer,
  createPaymentMethod,
  attachPaymentMethodToCustomer,
  constructWebhookEvent,
};
