import api from '@/lib/api';

/**
 * Request an OTP to be sent to the given phone number (SMS via backend → APITxT).
 * Throws an axios error on failure; read err.response.data.message for the reason.
 */
export const sendOtp = async (phone: string): Promise<void> => {
  await api.post('/api/v1/otp/send', { phone });
};

/**
 * Verify the OTP the user received. On success the backend marks the phone
 * verified for a short window so registration is allowed.
 */
export const verifyOtp = async (phone: string, otp: string): Promise<void> => {
  await api.post('/api/v1/otp/verify', { phone, otp });
};
