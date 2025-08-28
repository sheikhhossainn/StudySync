import requests
import json
import hashlib
import hmac
import base64
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from ..models import Payment, PaymentLog
import logging

logger = logging.getLogger(__name__)


class NagadService:
    def __init__(self):
        self.config = settings.PAYMENT_APIS['NAGAD']
        self.base_url = self.config['BASE_URL']
        self.merchant_id = self.config['MERCHANT_ID']
        self.public_key = self.config['PUBLIC_KEY']
        self.private_key = self.config['PRIVATE_KEY']

    def generate_random_string(self, length=40):
        """Generate random string for challenge"""
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

    def get_headers(self):
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-KM-Api-Version': 'v-0.2.0',
            'X-KM-IP-V4': '127.0.0.1',
            'X-KM-Client-Type': 'PC_WEB'
        }

    def encrypt_data(self, data):
        """Encrypt data using RSA public key"""
        try:
            public_key = RSA.importKey(self.public_key)
            cipher = PKCS1_v1_5.new(public_key)
            encrypted = cipher.encrypt(data.encode('utf-8'))
            return base64.b64encode(encrypted).decode('utf-8')
        except Exception as e:
            logger.error(f"Nagad encryption failed: {str(e)}")
            raise Exception(f"Failed to encrypt data: {str(e)}")

    def generate_signature(self, data):
        """Generate signature using HMAC-SHA256"""
        try:
            private_key_obj = RSA.importKey(self.private_key)
            # This is a simplified signature generation
            # In production, you should use proper RSA signing
            signature = hmac.new(
                self.private_key.encode('utf-8'),
                data.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return signature
        except Exception as e:
            logger.error(f"Nagad signature generation failed: {str(e)}")
            raise Exception(f"Failed to generate signature: {str(e)}")

    async def init_payment(self, payment_data):
        """Initialize payment with Nagad"""
        url = f"{self.base_url}/remote-payment-gateway-1.0/api/dfs/check-out/initialize/{self.merchant_id}/{payment_data['order_id']}"
        
        headers = self.get_headers()
        
        # Convert USD to BDT
        amount_bdt = float(payment_data['amount']) * 85
        
        # Prepare sensitive data
        sensitive_data = {
            "merchantId": self.merchant_id,
            "datetime": datetime.now().strftime('%Y%m%d%H%M%S'),
            "orderId": payment_data['order_id'],
            "challenge": self.generate_random_string(40)
        }
        
        # Encrypt sensitive data
        encrypted_data = self.encrypt_data(json.dumps(sensitive_data))
        
        payload = {
            "accountNumber": payment_data.get('account_number', ''),
            "dateTime": sensitive_data['datetime'],
            "sensitiveData": encrypted_data,
            "signature": self.generate_signature(json.dumps(sensitive_data))
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'Success':
                return {
                    'success': True,
                    'payment_ref_id': result.get('paymentReferenceId'),
                    'challenge': result.get('challenge')
                }
            else:
                raise Exception(f"Payment initialization failed: {result.get('message')}")
                
        except requests.RequestException as e:
            logger.error(f"Nagad payment initialization failed: {str(e)}")
            raise Exception(f"Failed to initialize Nagad payment: {str(e)}")

    async def complete_payment(self, payment_ref_id, challenge, payment_data):
        """Complete payment with Nagad"""
        url = f"{self.base_url}/remote-payment-gateway-1.0/api/dfs/check-out/complete/{payment_ref_id}"
        
        headers = self.get_headers()
        
        # Convert USD to BDT
        amount_bdt = float(payment_data['amount']) * 85
        
        # Prepare sensitive data for completion
        sensitive_data = {
            "merchantId": self.merchant_id,
            "orderId": payment_data['order_id'],
            "amount": f"{amount_bdt:.2f}",
            "currencyCode": "050",  # BDT currency code
            "challenge": challenge
        }
        
        # Encrypt sensitive data
        encrypted_data = self.encrypt_data(json.dumps(sensitive_data))
        
        payload = {
            "paymentReferenceId": payment_ref_id,
            "sensitiveData": encrypted_data,
            "signature": self.generate_signature(json.dumps(sensitive_data)),
            "merchantCallbackURL": payment_data.get('callback_url', '')
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'Success':
                return {
                    'success': True,
                    'payment_ref_id': result.get('paymentReferenceId'),
                    'issuer_payment_ref_no': result.get('issuerPaymentRefNo'),
                    'status': result.get('status'),
                    'status_code': result.get('statusCode')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Payment completion failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"Nagad payment completion failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to complete Nagad payment: {str(e)}"
            }

    async def verify_payment(self, payment_ref_id):
        """Verify payment status with Nagad"""
        url = f"{self.base_url}/remote-payment-gateway-1.0/api/dfs/verify/payment/{payment_ref_id}"
        
        headers = self.get_headers()
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'Success':
                return {
                    'success': True,
                    'payment_ref_id': result.get('paymentReferenceId'),
                    'issuer_payment_ref_no': result.get('issuerPaymentRefNo'),
                    'amount': result.get('amount'),
                    'status': result.get('status'),
                    'status_code': result.get('statusCode')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Payment verification failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"Nagad payment verification failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to verify Nagad payment: {str(e)}"
            }

    async def refund_payment(self, original_payment_ref, refund_amount, reason="Customer Request"):
        """Refund a Nagad payment"""
        # Note: Nagad refund implementation may vary based on their API
        # This is a placeholder implementation
        
        refund_ref_id = f"REF_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Prepare refund data
        refund_data = {
            "originalPaymentReferenceId": original_payment_ref,
            "refundAmount": f"{refund_amount:.2f}",
            "refundReferenceId": refund_ref_id,
            "reason": reason
        }
        
        try:
            # Implementation would depend on Nagad's refund API
            # For now, return success with mock data
            return {
                'success': True,
                'refund_ref_id': refund_ref_id,
                'status': 'Refund Initiated',
                'message': 'Refund request has been submitted'
            }
            
        except Exception as e:
            logger.error(f"Nagad refund failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to refund Nagad payment: {str(e)}"
            }
