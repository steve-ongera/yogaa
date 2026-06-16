import requests
import base64
import json
import datetime
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MpesaService:
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.passkey = settings.MPESA_PASSKEY
        self.shortcode = settings.MPESA_SHORTCODE
        self.environment = settings.MPESA_ENVIRONMENT
        
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
            self.auth_url = 'https://api.safaricom.co.ke/oauth/v1/generate'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
            self.auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate'
    
    def get_access_token(self):
        """Get M-Pesa access token"""
        try:
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_base64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_base64}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.auth_url}?grant_type=client_credentials",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('access_token')
            else:
                logger.error(f"Failed to get access token: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting M-Pesa access token: {str(e)}")
            return None
    
    def stk_push(self, phone_number, amount, transaction_id, description="Payment"):
        """Initiate STK push payment"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'success': False, 'message': 'Failed to get access token'}
            
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            password_str = f"{self.shortcode}{self.passkey}{timestamp}"
            password = base64.b64encode(password_str.encode('ascii')).decode('ascii')
            
            # Format phone number
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif phone_number.startswith('7'):
                phone_number = '254' + phone_number
            
            payload = {
                'BusinessShortCode': self.shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.shortcode,
                'PhoneNumber': phone_number,
                'CallBackURL': f"{settings.BASE_URL}/api/mpesa-callback/",
                'AccountReference': transaction_id,
                'TransactionDesc': description
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.base_url}/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'request_id': data.get('CheckoutRequestID'),
                    'merchant_request_id': data.get('MerchantRequestID'),
                    'response_code': data.get('ResponseCode'),
                    'message': data.get('CustomerMessage', 'Payment initiated')
                }
            else:
                logger.error(f"STK push failed: {response.text}")
                return {'success': False, 'message': 'Failed to initiate payment'}
                
        except Exception as e:
            logger.error(f"Error initiating STK push: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def process_callback(self, callback_data):
        """Process M-Pesa callback"""
        try:
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            request_id = stk_callback.get('CheckoutRequestID')
            
            if result_code != 0:
                logger.error(f"MPesa callback error: {result_desc}")
                return {'success': False, 'message': result_desc}
            
            # Extract transaction details
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            metadata_items = callback_metadata.get('Item', [])
            
            amount = None
            receipt_number = None
            transaction_date = None
            phone_number = None
            
            for item in metadata_items:
                if item.get('Name') == 'Amount':
                    amount = item.get('Value')
                elif item.get('Name') == 'MpesaReceiptNumber':
                    receipt_number = item.get('Value')
                elif item.get('Name') == 'TransactionDate':
                    transaction_date = item.get('Value')
                elif item.get('Name') == 'PhoneNumber':
                    phone_number = item.get('Value')
            
            # Get transaction from our database
            transaction_id = None
            if 'AccountReference' in stk_callback:
                transaction_id = stk_callback.get('AccountReference')
            else:
                # Try to find transaction by request ID
                from .models import PaymentTransaction
                transaction = PaymentTransaction.objects.filter(
                    mpesa_request_id=request_id
                ).first()
                if transaction:
                    transaction_id = transaction.id
            
            return {
                'success': True,
                'transaction_id': transaction_id,
                'receipt_number': receipt_number,
                'amount': amount,
                'phone_number': phone_number,
                'transaction_date': transaction_date,
                'request_id': request_id
            }
            
        except Exception as e:
            logger.error(f"Error processing M-Pesa callback: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def query_status(self, checkout_request_id):
        """Query STK push status"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'success': False, 'message': 'Failed to get access token'}
            
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            password_str = f"{self.shortcode}{self.passkey}{timestamp}"
            password = base64.b64encode(password_str.encode('ascii')).decode('ascii')
            
            payload = {
                'BusinessShortCode': self.shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.base_url}/mpesa/stkpushquery/v1/query",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Query status failed: {response.text}")
                return {'success': False, 'message': 'Failed to query status'}
                
        except Exception as e:
            logger.error(f"Error querying M-Pesa status: {str(e)}")
            return {'success': False, 'message': str(e)}