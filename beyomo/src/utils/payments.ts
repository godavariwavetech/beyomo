import RazorpayCheckout from 'react-native-razorpay';
import api from './api';
import {endpoints} from '../config/config';

export type PayResult =
  | {success: true; booking: any}
  | {success: false, reason: 'cancelled' | 'verify_failed' | 'order_failed'; message: string};

interface PayParams {
  bookingId: string | number;
  bookingCode?: string;
  contact?: string;
  name?: string;
  email?: string;
}

/**
 * Creates a Razorpay order for the given booking, opens the native checkout,
 * and verifies the payment with the backend. Never throws — always resolves
 * with a PayResult so callers can show the right message without try/catch.
 */
export const payWithRazorpay = async ({
  bookingId,
  bookingCode,
  contact,
  name,
  email,
}: PayParams): Promise<PayResult> => {
  let order: any;
  try {
    const orderRes = await api.post(endpoints.PAYMENT_CREATE_ORDER, {bookingId: String(bookingId)});
    order = orderRes.data?.data;
  } catch (err: any) {
    return {
      success: false,
      reason: 'order_failed',
      message: err?.response?.data?.message ?? 'Could not start payment. Please try again.',
    };
  }

  let razorpayResult: any;
  try {
    razorpayResult = await RazorpayCheckout.open({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Beyomo',
      description: bookingCode ?? order.bookingCode ?? 'Booking payment',
      prefill: {contact: contact ?? '', name: name ?? '', email: email ?? ''},
      theme: {color: '#105641'},
    });
  } catch (_err: any) {
    return {success: false, reason: 'cancelled', message: 'Payment was not completed.'};
  }

  try {
    const verifyRes = await api.post(endpoints.PAYMENT_VERIFY, {
      razorpayOrderId: razorpayResult.razorpay_order_id,
      razorpayPaymentId: razorpayResult.razorpay_payment_id,
      razorpaySignature: razorpayResult.razorpay_signature,
      bookingId: String(bookingId),
    });
    return {success: true, booking: verifyRes.data?.data?.booking};
  } catch (err: any) {
    return {
      success: false,
      reason: 'verify_failed',
      message: err?.response?.data?.message ?? 'Payment verification failed.',
    };
  }
};
