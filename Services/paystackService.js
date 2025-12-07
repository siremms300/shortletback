// Services/paystackService.js - UPDATED VERSION
const axios = require('axios');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseURL = 'https://api.paystack.co';
    
    // Log Paystack config (hide full key for security)
    console.log('📱 [Paystack Service] Initialized with key:', 
      this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'MISSING');
  }

  async initializeTransaction(data) {
    try {
      const payload = {
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        metadata: data.metadata
      };

      // Add callback_url if provided, otherwise use default
      if (data.callback_url) {
        payload.callback_url = data.callback_url;
      } else {
        payload.callback_url = `${process.env.CLIENT_URL}/booking/success`;
      }

      console.log('📱 [Paystack Service] Initializing transaction:', {
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        callback_url: payload.callback_url,
        metadata: data.metadata
      });

      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ [Paystack Service] Transaction initialized:', {
        status: response.data.status,
        message: response.data.message,
        authorization_url: response.data.data?.authorization_url ? 'PRESENT' : 'MISSING',
        reference: response.data.data?.reference
      });

      // Check if response has data
      if (!response.data.data) {
        throw new Error(`Paystack returned no data: ${response.data.message || 'Unknown error'}`);
      }

      return response.data.data;

    } catch (error) {
      console.error('❌ [Paystack Service] Initialization error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Throw a more descriptive error
      if (error.response?.data?.message) {
        throw new Error(`Paystack Error: ${error.response.data.message}`);
      }
      
      throw new Error(`Failed to initialize payment: ${error.message}`);
    }
  }

  async verifyTransaction(reference) {
    try {
      console.log('📱 [Paystack Service] Verifying transaction:', reference);
      
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          },
          timeout: 10000
        }
      );

      console.log('✅ [Paystack Service] Verification response:', {
        status: response.data.status,
        message: response.data.message
      });

      return response.data.data;
    } catch (error) {
      console.error('❌ [Paystack Service] Verification error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }

  async initiateRefund(reference, amount = null) {
    try {
      const refundData = { transaction: reference };
      if (amount) refundData.amount = amount;

      console.log('📱 [Paystack Service] Initiating refund:', reference);

      const response = await axios.post(
        `${this.baseURL}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ [Paystack Service] Refund initiated');
      return response.data.data;
    } catch (error) {
      console.error('❌ [Paystack Service] Refund error:', error.response?.data || error.message);
      throw new Error('Failed to initiate refund');
    }
  }
}

module.exports = new PaystackService();































// // Services/paystackService.js - UPDATED VERSION
// const axios = require('axios');

// class PaystackService {
//   constructor() {
//     this.secretKey = process.env.PAYSTACK_SECRET_KEY;
//     this.baseURL = 'https://api.paystack.co';
//   }

//   async initializeTransaction(data) {
//     try {
//       const payload = {
//         email: data.email,
//         amount: data.amount,
//         reference: data.reference,
//         metadata: data.metadata
//       };

//       // Add callback_url if provided, otherwise use default
//       if (data.callback_url) {
//         payload.callback_url = data.callback_url;
//       } else {
//         // Default fallback - you can remove this if you always want to specify callback_url
//         payload.callback_url = `${process.env.CLIENT_URL}/booking/success`;
//       }

//       console.log('Paystack initialization payload:', {
//         email: data.email,
//         amount: data.amount,
//         reference: data.reference,
//         callback_url: payload.callback_url,
//         metadata: data.metadata
//       });

//       const response = await axios.post(
//         `${this.baseURL}/transaction/initialize`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       return response.data.data;
//     } catch (error) {
//       console.error('Paystack initialization error:', error.response?.data || error.message);
//       throw new Error('Failed to initialize payment');
//     }
//   }

//   async verifyTransaction(reference) {
//     try {
//       const response = await axios.get(
//         `${this.baseURL}/transaction/verify/${reference}`,
//         {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`
//           }
//         }
//       );

//       return response.data.data;
//     } catch (error) {
//       console.error('Paystack verification error:', error.response?.data || error.message);
//       throw new Error('Failed to verify payment');
//     }
//   }

//   async initiateRefund(reference, amount = null) {
//     try {
//       const refundData = { transaction: reference };
//       if (amount) refundData.amount = amount;

//       const response = await axios.post(
//         `${this.baseURL}/refund`,
//         refundData,
//         {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       return response.data.data;
//     } catch (error) {
//       console.error('Paystack refund error:', error.response?.data || error.message);
//       throw new Error('Failed to initiate refund');
//     }
//   }
// }

// module.exports = new PaystackService();





































// const axios = require('axios');

// class PaystackService {
//   constructor() {
//     this.secretKey = process.env.PAYSTACK_SECRET_KEY;
//     this.baseURL = 'https://api.paystack.co';
//   }

//   async initializeTransaction(data) {
//     try {
//       const response = await axios.post(
//         `${this.baseURL}/transaction/initialize`,
//         {
//           email: data.email,
//           amount: data.amount,
//           reference: data.reference,
//           metadata: data.metadata,
//           callback_url: `${process.env.CLIENT_URL}/booking/success`
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       return response.data.data;
//     } catch (error) {
//       console.error('Paystack initialization error:', error.response?.data || error.message);
//       throw new Error('Failed to initialize payment');
//     }
//   }

//   async verifyTransaction(reference) {
//     try {
//       const response = await axios.get(
//         `${this.baseURL}/transaction/verify/${reference}`,
//         {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`
//           }
//         }
//       );

//       return response.data.data;
//     } catch (error) {
//       console.error('Paystack verification error:', error.response?.data || error.message);
//       throw new Error('Failed to verify payment');
//     }
//   }

//   async initiateRefund(reference, amount = null) {
//     try {
//       const refundData = { transaction: reference };
//       if (amount) refundData.amount = amount;

//       const response = await axios.post(
//         `${this.baseURL}/refund`,
//         refundData,
//         {
//           headers: {
//             Authorization: `Bearer ${this.secretKey}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       return response.data.data;
//     } catch (error) {
//       console.error('Paystack refund error:', error.response?.data || error.message);
//       throw new Error('Failed to initiate refund');
//     }
//   }
// }

// module.exports = new PaystackService();
