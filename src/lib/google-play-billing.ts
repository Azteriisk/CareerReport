/**
 * Frontend billing bridge utility for Google Play Store In-App Purchases.
 *
 * This connects to the browser's Digital Goods API and Payment Request API,
 * which are injected by the Chrome container when running inside a Trusted Web Activity (TWA).
 */

export interface GooglePlayPurchaseResult {
  purchaseToken: string;
  sku: string;
  paymentResponse: PaymentResponse;
}

/**
 * Checks if the Google Play Billing (Digital Goods API) is available in the current environment.
 * This is only true when running as an installed TWA app on Android.
 */
export function isGooglePlayBillingAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'getDigitalGoodsService' in window;
}

/**
 * Retrieves the details of subscription products from the Google Play Store.
 * 
 * @param skus List of subscription SKUs to query (e.g. ['pro_monthly_subscription'])
 */
export async function getGooglePlayProductDetails(skus: string[]): Promise<any[]> {
  if (!isGooglePlayBillingAvailable()) {
    throw new Error('Google Play Billing is not supported in this browser environment.');
  }

  try {
    // @ts-ignore
    const service = await window.getDigitalGoodsService('https://play.google.com/billing');
    return await service.getDetails(skus);
  } catch (error) {
    console.error('Failed to query Google Play product details:', error);
    throw error;
  }
}

/**
 * Initiates the Google Play checkout flow for a given SKU (Product ID).
 * 
 * @param sku The subscription product ID configured in the Google Play Console (e.g., 'pro_monthly_subscription')
 * @param priceValue The estimated total price value (e.g., '9.00') for the PaymentRequest declaration
 * @returns The purchase result containing the cryptographic purchaseToken
 */
export async function purchaseGooglePlaySubscription(
  sku: string,
  priceValue: string = '9.00'
): Promise<GooglePlayPurchaseResult> {
  if (!isGooglePlayBillingAvailable()) {
    throw new Error('Google Play Billing is not supported in this browser environment.');
  }

  // Define payment methods for Google Play
  const paymentMethods = [
    {
      supportedMethods: 'https://play.google.com/billing',
      data: {
        sku: sku,
      },
    },
  ];

  // Standard checkout request metadata
  const paymentDetails = {
    total: {
      label: 'Total',
      amount: {
        currency: 'USD',
        value: priceValue,
      },
    },
  };

  try {
    // Initialize standard Web Payment Request
    const request = new PaymentRequest(paymentMethods, paymentDetails);
    
    // Display the native Google Play purchase dialog
    const response = await request.show();
    
    // Retrieve purchase details
    const details = response.details;
    const purchaseToken = details?.purchaseToken;

    if (!purchaseToken) {
      // Complete the response as a failure
      await response.complete('fail');
      throw new Error('Purchase completed, but no purchase token was returned by Google Play.');
    }

    return {
      purchaseToken,
      sku,
      paymentResponse: response,
    };
  } catch (error) {
    console.error('Google Play purchase flow failed:', error);
    throw error;
  }
}
