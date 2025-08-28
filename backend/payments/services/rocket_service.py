import requests
import json
import hashlib
import hmac
import base64
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from ..models import Payment, PaymentLog
import logging

logger = logging.getLogger(__name__)


class RocketService:
    def __init__(self):
        self.config = settings.PAYMENT_APIS['ROCKET']
        self.base_url = self.config['BASE_URL']
        self.merchant_id = self.config['MERCHANT_ID']
        self.api_key = self.config['API_KEY']
        self.secret_key = self.config['SECRET_KEY']

    def get_headers(self):
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }

    def generate_signature(self, data):
        """Generate HMAC signature for Rocket API"""
        try:
            message = json.dumps(data, sort_keys=True)
            signature = hmac.new(
                self.secret_key.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return signature
        except Exception as e:
            logger.error(f"Rocket signature generation failed: {str(e)}")
            raise Exception(f"Failed to generate signature: {str(e)}")

    async def initiate_payment(self, payment_data):
        """Initiate payment with Rocket"""
        url = f"{self.base_url}/payment/initiate"
        
        headers = self.get_headers()
        
        # Convert USD to BDT
        amount_bdt = float(payment_data['amount']) * 85
        
        payload = {
            "merchant_id": self.merchant_id,
            "order_id": payment_data['order_id'],
            "amount": f"{amount_bdt:.2f}",
            "currency": "BDT",
            "description": payment_data.get('description', 'StudySync Payment'),
            "customer_name": payment_data.get('customer_name', ''),
            "customer_email": payment_data.get('customer_email', ''),
            "customer_phone": payment_data.get('customer_phone', ''),
            "success_url": payment_data.get('success_url', ''),
            "cancel_url": payment_data.get('cancel_url', ''),
            "fail_url": payment_data.get('fail_url', ''),
            "timestamp": int(datetime.now().timestamp())
        }
        
        # Add signature
        payload['signature'] = self.generate_signature(payload)
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'success': True,
                    'transaction_id': result.get('transaction_id'),
                    'payment_url': result.get('payment_url'),
                    'order_id': result.get('order_id'),
                    'amount': result.get('amount')
                }
            else:
                raise Exception(f"Payment initiation failed: {result.get('message')}")
                
        except requests.RequestException as e:
            logger.error(f"Rocket payment initiation failed: {str(e)}")
            raise Exception(f"Failed to initiate Rocket payment: {str(e)}")

    async def confirm_payment(self, transaction_id, otp_code):
        """Confirm payment with OTP"""
        url = f"{self.base_url}/payment/confirm"
        
        headers = self.get_headers()
        
        payload = {
            "merchant_id": self.merchant_id,
            "transaction_id": transaction_id,
            "otp_code": otp_code,
            "timestamp": int(datetime.now().timestamp())
        }
        
        # Add signature
        payload['signature'] = self.generate_signature(payload)
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'success': True,
                    'transaction_id': result.get('transaction_id'),
                    'status': result.get('payment_status'),
                    'amount': result.get('amount'),
                    'fee': result.get('fee'),
                    'reference_id': result.get('reference_id')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Payment confirmation failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"Rocket payment confirmation failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to confirm Rocket payment: {str(e)}"
            }

    async def check_status(self, transaction_id):
        """Check payment status"""
        url = f"{self.base_url}/payment/status/{transaction_id}"
        
        headers = self.get_headers()
        
        query_params = {
            "merchant_id": self.merchant_id,
            "timestamp": int(datetime.now().timestamp())
        }
        
        # Add signature to query params
        query_params['signature'] = self.generate_signature(query_params)
        
        try:
            response = requests.get(url, headers=headers, params=query_params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'success': True,
                    'transaction_id': result.get('transaction_id'),
                    'payment_status': result.get('payment_status'),
                    'amount': result.get('amount'),
                    'fee': result.get('fee'),
                    'reference_id': result.get('reference_id'),
                    'completion_time': result.get('completion_time')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Status check failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"Rocket status check failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to check Rocket payment status: {str(e)}"
            }

    async def refund_payment(self, transaction_id, refund_amount, reason="Customer Request"):
        """Refund a Rocket payment"""
        url = f"{self.base_url}/payment/refund"
        
        headers = self.get_headers()
        
        payload = {
            "merchant_id": self.merchant_id,
            "transaction_id": transaction_id,
            "refund_amount": f"{refund_amount:.2f}",
            "refund_reason": reason,
            "timestamp": int(datetime.now().timestamp())
        }
        
        # Add signature
        payload['signature'] = self.generate_signature(payload)
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'success': True,
                    'refund_transaction_id': result.get('refund_transaction_id'),
                    'refund_status': result.get('refund_status'),
                    'refund_amount': result.get('refund_amount'),
                    'reference_id': result.get('reference_id')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Refund failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"Rocket refund failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to refund Rocket payment: {str(e)}"
            }

    async def get_balance(self):
        """Get merchant account balance"""
        url = f"{self.base_url}/merchant/balance"
        
        headers = self.get_headers()
        
        query_params = {
            "merchant_id": self.merchant_id,
            "timestamp": int(datetime.now().timestamp())
        }
        
        # Add signature
        query_params['signature'] = self.generate_signature(query_params)
        
        try:
            response = requests.get(url, headers=headers, params=query_params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'success': True,
                    'balance': result.get('balance'),
                    'currency': result.get('currency')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Balance check failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"Rocket balance check failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to check Rocket balance: {str(e)}"
            }
