"""
StudySync Payment Gateway Integration
Supports: bKash, Nagad, Rocket, and Manual Payment Verification
"""

import requests
import json
import hashlib
import uuid
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from typing import Dict, Any, Optional


class PaymentGatewayError(Exception):
    """Custom exception for payment gateway errors"""
    pass


class BasePaymentGateway:
    """Base class for all payment gateways"""
    
    def __init__(self):
        self.base_url = ""
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def initiate_payment(self, amount: Decimal, currency: str, user_data: Dict) -> Dict[str, Any]:
        """Initiate payment process"""
        raise NotImplementedError
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify payment status"""
        raise NotImplementedError
    
    def generate_transaction_id(self) -> str:
        """Generate unique transaction ID"""
        return f"STUDYSYNC_{uuid.uuid4().hex[:12].upper()}"


class BKashGateway(BasePaymentGateway):
    """bKash payment gateway integration"""
    
    def __init__(self):
        super().__init__()
        self.base_url = getattr(settings, 'BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta')
        self.app_key = getattr(settings, 'BKASH_APP_KEY', '')
        self.app_secret = getattr(settings, 'BKASH_APP_SECRET', '')
        self.username = getattr(settings, 'BKASH_USERNAME', '')
        self.password = getattr(settings, 'BKASH_PASSWORD', '')
        self.headers.update({
            'X-APP-Key': self.app_key
        })
    
    def get_access_token(self) -> str:
        """Get access token for bKash API"""
        url = f"{self.base_url}/tokenized/checkout/token/grant"
        
        payload = {
            'app_key': self.app_key,
            'app_secret': self.app_secret
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('id_token', '')
        else:
            raise PaymentGatewayError(f"Failed to get bKash token: {response.text}")
    
    def initiate_payment(self, amount: Decimal, currency: str, user_data: Dict) -> Dict[str, Any]:
        """Initiate bKash payment"""
        try:
            token = self.get_access_token()
            self.headers['Authorization'] = token
            
            url = f"{self.base_url}/tokenized/checkout/create"
            
            payload = {
                'mode': '0011',  # Checkout
                'payerReference': user_data.get('phone', ''),
                'callbackURL': f"{settings.FRONTEND_URL}/payment/callback/bkash/",
                'amount': str(amount),
                'currency': currency,
                'intent': 'sale',
                'merchantInvoiceNumber': self.generate_transaction_id()
            }
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'transaction_id': data.get('paymentID'),
                    'checkout_url': data.get('bkashURL'),
                    'gateway_response': data
                }
            else:
                return {
                    'success': False,
                    'error': f"bKash payment initiation failed: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify bKash payment"""
        try:
            token = self.get_access_token()
            self.headers['Authorization'] = token
            
            url = f"{self.base_url}/tokenized/checkout/payment/status"
            
            payload = {
                'paymentID': transaction_id
            }
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                
                return {
                    'success': True,
                    'status': data.get('transactionStatus', '').lower(),
                    'amount': Decimal(data.get('amount', '0')),
                    'transaction_ref': data.get('trxID'),
                    'gateway_response': data
                }
            else:
                return {
                    'success': False,
                    'error': f"Payment verification failed: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


class NagadGateway(BasePaymentGateway):
    """Nagad payment gateway integration"""
    
    def __init__(self):
        super().__init__()
        self.base_url = getattr(settings, 'NAGAD_BASE_URL', 'https://api.mynagad.com:10043/remote-payment-gateway-1.0/api/dfs')
        self.merchant_id = getattr(settings, 'NAGAD_MERCHANT_ID', '')
        self.public_key = getattr(settings, 'NAGAD_PUBLIC_KEY', '')
        self.private_key = getattr(settings, 'NAGAD_PRIVATE_KEY', '')
    
    def initiate_payment(self, amount: Decimal, currency: str, user_data: Dict) -> Dict[str, Any]:
        """Initiate Nagad payment"""
        try:
            order_id = self.generate_transaction_id()
            
            payload = {
                'accountNumber': user_data.get('phone', ''),
                'amount': str(amount),
                'orderId': order_id,
                'productDetails': 'StudySync Premium Subscription',
                'clientIp': '192.168.1.1'  # You might want to get real IP
            }
            
            # Nagad requires signature generation - simplified version
            url = f"{self.base_url}/check-out/initialize/{self.merchant_id}/{order_id}"
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'transaction_id': order_id,
                    'checkout_url': data.get('callBackUrl'),
                    'gateway_response': data
                }
            else:
                return {
                    'success': False,
                    'error': f"Nagad payment initiation failed: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify Nagad payment"""
        try:
            url = f"{self.base_url}/verify/payment/{self.merchant_id}/{transaction_id}"
            
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                
                return {
                    'success': True,
                    'status': data.get('status', '').lower(),
                    'amount': Decimal(data.get('amount', '0')),
                    'transaction_ref': data.get('issuerPaymentRefNo'),
                    'gateway_response': data
                }
            else:
                return {
                    'success': False,
                    'error': f"Payment verification failed: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


class AamarPayGateway(BasePaymentGateway):
    """AamarPay payment gateway integration"""
    
    def __init__(self):
        super().__init__()
        self.base_url = getattr(settings, 'AAMARPAY_BASE_URL', 'https://sandbox.aamarpay.com')
        self.store_id = getattr(settings, 'AAMARPAY_STORE_ID', 'aamarpaytest')
        self.signature_key = getattr(settings, 'AAMARPAY_SIGNATURE_KEY', 'dbb74894e82415a2f7ff0ec3a97e4183')
    
    def generate_signature(self, data: Dict) -> str:
        """Generate signature for AamarPay request"""
        # Sort parameters by key
        sorted_data = dict(sorted(data.items()))
        
        # Create query string
        query_string = '&'.join([f"{key}={value}" for key, value in sorted_data.items()])
        
        # Add signature key
        signature_string = query_string + '&key=' + self.signature_key
        
        # Generate MD5 hash
        signature = hashlib.md5(signature_string.encode()).hexdigest()
        
        return signature
    
    def initiate_payment(self, amount: Decimal, currency: str, user_data: Dict) -> Dict[str, Any]:
        """Initiate AamarPay payment"""
        try:
            transaction_id = self.generate_transaction_id()
            
            # Prepare payment data
            payment_data = {
                'store_id': self.store_id,
                'tran_id': transaction_id,
                'success_url': f"{settings.FRONTEND_URL}/payment/callback/aamarpay/success/",
                'fail_url': f"{settings.FRONTEND_URL}/payment/callback/aamarpay/fail/",
                'cancel_url': f"{settings.FRONTEND_URL}/payment/callback/aamarpay/cancel/",
                'amount': str(amount),
                'currency': currency,
                'desc': 'StudySync Premium Subscription',
                'cus_name': user_data.get('name', 'StudySync User'),
                'cus_email': user_data.get('email', ''),
                'cus_add1': user_data.get('address', 'Dhaka, Bangladesh'),
                'cus_add2': '',
                'cus_city': user_data.get('city', 'Dhaka'),
                'cus_state': user_data.get('state', 'Dhaka'),
                'cus_postcode': user_data.get('zip', '1000'),
                'cus_country': 'Bangladesh',
                'cus_phone': user_data.get('phone', ''),
                'type': 'json'
            }
            
            # Generate signature
            payment_data['signature'] = self.generate_signature(payment_data)
            
            # Make API request
            url = f"{self.base_url}/jsonpost.php"
            
            response = requests.post(url, data=payment_data, headers={
                'Content-Type': 'application/x-www-form-urlencoded'
            })
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('result') == 'true':
                    return {
                        'success': True,
                        'transaction_id': transaction_id,
                        'checkout_url': data.get('payment_url'),
                        'gateway_response': data
                    }
                else:
                    return {
                        'success': False,
                        'error': f"AamarPay payment initiation failed: {data.get('reason', 'Unknown error')}"
                    }
            else:
                return {
                    'success': False,
                    'error': f"AamarPay API error: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify AamarPay payment"""
        try:
            # AamarPay verification endpoint
            url = f"{self.base_url}/api/v1/trxcheck/request.php"
            
            verification_data = {
                'store_id': self.store_id,
                'tran_id': transaction_id,
                'signature': self.generate_signature({
                    'store_id': self.store_id,
                    'tran_id': transaction_id
                })
            }
            
            response = requests.post(url, data=verification_data, headers={
                'Content-Type': 'application/x-www-form-urlencoded'
            })
            
            if response.status_code == 200:
                data = response.json()
                
                # Map AamarPay status to our status
                status_mapping = {
                    'Successful': 'completed',
                    'Processing': 'pending',
                    'Failed': 'failed',
                    'Cancelled': 'cancelled'
                }
                
                payment_status = status_mapping.get(data.get('pay_status'), 'unknown')
                
                return {
                    'success': True,
                    'status': payment_status,
                    'amount': Decimal(data.get('amount', '0')),
                    'transaction_ref': data.get('mer_txnid'),
                    'gateway_response': data
                }
            else:
                return {
                    'success': False,
                    'error': f"Payment verification failed: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


class ManualPaymentVerifier:
    """Manual payment verification for bank transfers, etc."""
    
    @staticmethod
    def verify_manual_payment(payment_data: Dict) -> Dict[str, Any]:
        """Verify manual payment submission"""
        required_fields = ['transaction_ref', 'amount', 'payment_method', 'payment_date']
        
        for field in required_fields:
            if not payment_data.get(field):
                return {
                    'success': False,
                    'error': f'Missing required field: {field}'
                }
        
        # In real implementation, you might want to:
        # 1. Store the manual payment for admin review
        # 2. Send notification to admin
        # 3. Generate a verification token
        
        return {
            'success': True,
            'status': 'pending_verification',
            'message': 'Manual payment submitted for verification. You will be notified within 24 hours.',
            'verification_id': f"MANUAL_{uuid.uuid4().hex[:8].upper()}"
        }


# Gateway factory
class PaymentGatewayFactory:
    """Factory to get appropriate payment gateway"""
    
    @staticmethod
    def get_gateway(payment_method: str):
        """Get payment gateway instance"""
        gateways = {
            'bkash': BKashGateway,
            'nagad': NagadGateway,
            'aamarpay': AamarPayGateway
        }
        
        gateway_class = gateways.get(payment_method.lower())
        if not gateway_class:
            raise PaymentGatewayError(f"Unsupported payment method: {payment_method}")
        
        return gateway_class()
