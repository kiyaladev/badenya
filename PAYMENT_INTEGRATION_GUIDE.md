# 💳 Payment Integration Guide - CinetPay & Wave

**Status:** Documentation Ready | **Implementation:** Requires External Accounts

## Overview

This guide documents the payment integration strategy for Badenya, covering:
- CinetPay (Ivory Coast, West Africa)
- Wave (Mobile Money - Senegal, Ivory Coast, Burkina Faso, Mali)
- Orange Money / MTN Mobile Money (future)

## Prerequisites

### Required Accounts

1. **CinetPay Developer Account**
   - Website: https://cinetpay.com
   - Sign up: https://cinetpay.com/register
   - Requirements: Business registration documents
   - Approval time: 2-5 business days

2. **Wave Business Account**
   - Website: https://wave.com
   - Contact: business@wave.com
   - Requirements: Business license, ID verification
   - Approval time: 1-2 weeks

### Development vs Production

| Environment | Purpose | API Access | Real Money |
|------------|---------|------------|------------|
| Sandbox | Testing | Limited test endpoints | No |
| Production | Live transactions | Full API access | Yes |

## CinetPay Integration

### 1. Account Setup

```bash
# Step 1: Register at https://cinetpay.com/register
# Step 2: Complete KYC (Know Your Customer)
# Step 3: Get API credentials from dashboard
```

### 2. API Credentials

```env
# Add to backend/.env
CINETPAY_API_KEY=your_api_key_here
CINETPAY_SITE_ID=your_site_id_here
CINETPAY_SECRET_KEY=your_secret_key_here
CINETPAY_ENV=sandbox # or 'production'
CINETPAY_NOTIFY_URL=https://yourdomain.com/api/v1/payments/cinetpay/webhook
CINETPAY_RETURN_URL=https://yourdomain.com/payment/success
CINETPAY_CANCEL_URL=https://yourdomain.com/payment/cancel
```

### 3. Backend Implementation

**Create Payment Service:**

```typescript
// backend/src/services/payment.service.ts
import axios from 'axios';
import crypto from 'crypto';

interface CinetPayConfig {
  apiKey: string;
  siteId: string;
  secretKey: string;
  env: 'sandbox' | 'production';
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  transactionId: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface PaymentResponse {
  code: string;
  message: string;
  data: {
    payment_url: string;
    payment_token: string;
  };
}

export class CinetPayService {
  private config: CinetPayConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      apiKey: process.env.CINETPAY_API_KEY!,
      siteId: process.env.CINETPAY_SITE_ID!,
      secretKey: process.env.CINETPAY_SECRET_KEY!,
      env: (process.env.CINETPAY_ENV as 'sandbox' | 'production') || 'sandbox',
      notifyUrl: process.env.CINETPAY_NOTIFY_URL!,
      returnUrl: process.env.CINETPAY_RETURN_URL!,
      cancelUrl: process.env.CINETPAY_CANCEL_URL!,
    };

    this.baseUrl = this.config.env === 'production'
      ? 'https://api.cinetpay.com/v2'
      : 'https://api-checkout.cinetpay.com/v2';
  }

  /**
   * Initialize a payment
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: request.transactionId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        notify_url: this.config.notifyUrl,
        return_url: this.config.returnUrl,
        cancel_url: this.config.cancelUrl,
        customer_name: request.customerName,
        customer_surname: request.customerName,
        customer_email: request.customerEmail,
        customer_phone_number: request.customerPhone,
        customer_address: 'N/A',
        customer_city: 'N/A',
        customer_country: 'CI',
        customer_state: 'N/A',
        customer_zip_code: 'N/A',
      };

      const response = await axios.post<PaymentResponse>(
        `${this.baseUrl}/payment`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`CinetPay payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<any> {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId,
      };

      const response = await axios.post(
        `${this.baseUrl}/payment/check`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`CinetPay status check failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    const computedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return computedSignature === signature;
  }
}
```

**Create Payment Controller:**

```typescript
// backend/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { CinetPayService } from '../services/payment.service';
import { Transaction } from '../models';
import { AuthRequest } from '../middleware/auth';

const cinetPayService = new CinetPayService();

/**
 * Initialize a payment
 */
export const initiatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, groupId } = req.body;
    const user = req.user!;

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create pending transaction in database
    const transaction = await Transaction.create({
      groupId,
      initiatedBy: user._id,
      type: 'contribution',
      amount,
      description,
      status: 'pending',
      paymentMethod: 'cinetpay',
      externalTransactionId: transactionId,
    });

    // Initiate payment with CinetPay
    const paymentResponse = await cinetPayService.initiatePayment({
      amount,
      currency: 'XOF', // West African CFA Franc
      transactionId,
      description,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.phone,
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment initiated successfully',
      data: {
        transaction,
        paymentUrl: paymentResponse.data.payment_url,
        paymentToken: paymentResponse.data.payment_token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Webhook handler for payment notifications
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-cinetpay-signature'] as string;
    const payload = req.body;

    // Verify webhook signature
    if (!cinetPayService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid webhook signature',
      });
    }

    const { transaction_id, payment_status } = payload;

    // Find transaction in database
    const transaction = await Transaction.findOne({
      externalTransactionId: transaction_id,
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    // Update transaction status
    transaction.status = payment_status === 'ACCEPTED' ? 'verified' : 'failed';
    transaction.verifiedAt = payment_status === 'ACCEPTED' ? new Date() : undefined;
    await transaction.save();

    // TODO: Send notification to user
    // TODO: Update group balance if payment successful

    res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;

    const status = await cinetPayService.checkPaymentStatus(transactionId);

    res.status(200).json({
      status: 'success',
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
```

**Create Routes:**

```typescript
// backend/src/routes/payment.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  initiatePayment,
  handlePaymentWebhook,
  checkPaymentStatus,
} from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/payments/initiate:
 *   post:
 *     summary: Initiate a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - groupId
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               groupId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 */
router.post('/initiate', authenticate, initiatePayment);

/**
 * @swagger
 * /api/v1/payments/cinetpay/webhook:
 *   post:
 *     summary: CinetPay webhook handler
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/cinetpay/webhook', handlePaymentWebhook);

/**
 * @swagger
 * /api/v1/payments/status/{transactionId}:
 *   get:
 *     summary: Check payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/status/:transactionId', authenticate, checkPaymentStatus);

export default router;
```

### 4. Mobile Integration

```typescript
// mobile/services/payment.service.ts
import axios from 'axios';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

interface PaymentInitiateRequest {
  amount: number;
  description: string;
  groupId: string;
}

class PaymentService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  /**
   * Initiate a payment
   */
  async initiatePayment(request: PaymentInitiateRequest, token: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/initiate`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { paymentUrl } = response.data.data;

      // Open payment page in browser
      await WebBrowser.openBrowserAsync(paymentUrl);
    } catch (error: any) {
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string, token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/status/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(`Status check failed: ${error.message}`);
    }
  }
}

export default new PaymentService();
```

```typescript
// mobile/app/(screens)/make-payment.tsx
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import paymentService from '@/services/payment.service';

export default function MakePaymentScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    setLoading(true);
    try {
      await paymentService.initiatePayment(
        {
          amount: parseFloat(amount),
          description: description || 'Contribution',
          groupId: 'your-group-id', // Get from navigation params
        },
        token!
      );

      Alert.alert(
        'Succès',
        'Paiement initié. Veuillez compléter le paiement dans le navigateur.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-6 pt-6">
      <Text className="text-2xl font-bold text-gray-800 mb-6">
        Effectuer un paiement
      </Text>

      <Input
        label="Montant (XOF)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Ex: 10000"
      />

      <Input
        label="Description (optionnel)"
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Contribution mensuelle"
        multiline
        numberOfLines={3}
      />

      <Button
        title="Payer maintenant"
        onPress={handlePayment}
        loading={loading}
        className="mt-6"
      />
    </View>
  );
}
```

## Wave Integration

### 1. Wave API Setup

```env
# Add to backend/.env
WAVE_API_KEY=your_wave_api_key
WAVE_SECRET_KEY=your_wave_secret_key
WAVE_ENV=sandbox # or 'production'
```

### 2. Wave Payment Service

```typescript
// backend/src/services/wave.service.ts
import axios from 'axios';

interface WavePaymentRequest {
  amount: number;
  currency: string;
  error_url: string;
  success_url: string;
}

export class WaveService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WAVE_API_KEY!;
    this.secretKey = process.env.WAVE_SECRET_KEY!;
    this.baseUrl = process.env.WAVE_ENV === 'production'
      ? 'https://api.wave.com/v1'
      : 'https://api.wave.com/sandbox/v1';
  }

  async createCheckout(request: WavePaymentRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/sessions`,
        request,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Wave checkout failed: ${error.message}`);
    }
  }
}
```

## Testing

### Sandbox Testing

**CinetPay Test Cards:**
```
Card Number: 4111111111111111
CVV: 123
Expiry: Any future date
```

**Wave Test Credentials:**
```
Phone: +221771234567
PIN: 1234
```

### Test Scenarios

1. **Successful Payment:**
   - Initiate payment
   - Complete payment in browser
   - Verify webhook received
   - Check transaction status updated

2. **Failed Payment:**
   - Initiate payment
   - Cancel in payment page
   - Verify transaction marked as failed

3. **Webhook Verification:**
   - Test signature validation
   - Test duplicate webhook handling
   - Test malformed webhook data

## Deployment Checklist

- [ ] Register for production CinetPay account
- [ ] Complete KYC verification
- [ ] Get production API credentials
- [ ] Configure production webhook URLs
- [ ] Test in sandbox thoroughly
- [ ] Set up production environment variables
- [ ] Configure SSL for webhook endpoints
- [ ] Implement transaction logging
- [ ] Set up payment reconciliation process
- [ ] Configure fraud detection rules
- [ ] Test production payments with small amounts
- [ ] Monitor first 100 transactions closely

## Security Best Practices

1. **API Keys:**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys periodically

2. **Webhooks:**
   - Always verify webhook signatures
   - Use HTTPS only
   - Implement idempotency

3. **Transaction Logging:**
   - Log all payment attempts
   - Store webhook payloads
   - Maintain audit trail

4. **Error Handling:**
   - Handle network failures gracefully
   - Implement retry logic
   - Provide clear user feedback

## Support & Resources

- **CinetPay Documentation:** https://docs.cinetpay.com
- **CinetPay Support:** support@cinetpay.com
- **Wave Documentation:** https://developer.wave.com
- **Wave Support:** developers@wave.com

## Next Steps

1. **Create Developer Accounts** (External - Cannot do in sandbox)
2. **Get API Credentials** (Requires account approval)
3. **Implement Backend Services** (Code ready above ✅)
4. **Implement Mobile UI** (Code ready above ✅)
5. **Test in Sandbox** (Requires API credentials)
6. **Deploy Webhooks** (Requires production environment)
7. **Go Live** (After thorough testing)

---

**Status:** Ready for implementation once external accounts are created.
**Estimated Time:** 2-3 days after receiving API credentials.
