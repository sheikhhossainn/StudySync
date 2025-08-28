import requests
import json
import base64
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from ..models import Payment, PaymentLog
import logging

logger = logging.getLogger(__name__)


class BkashService:
    def __init__(self):
        self.config = settings.PAYMENT_APIS['BKASH']
        self.base_url = self.config['BASE_URL']
        self.username = self.config['USERNAME']
        self.password = self.config['PASSWORD']
        self.app_key = self.config['APP_KEY']
        self.app_secret = self.config['APP_SECRET']
        self.token = None
        self.token_expires = None

    def get_headers(self, with_token=False):
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-APP-Key': self.app_key
        }
        
        if with_token and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        return headers

    async def get_access_token(self):
        """Get access token from bKash API"""
        if self.token and self.token_expires and timezone.now() < self.token_expires:
            return self.token

        url = f"{self.base_url}/checkout/token/grant"
        
        auth_string = f"{self.username}:{self.password}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = self.get_headers()
        headers['Authorization'] = f'Basic {auth_b64}'
        
        data = {
            "app_key": self.app_key,
            "app_secret": self.app_secret
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('statusCode') == '0000':
                self.token = result.get('id_token')
                # Token expires in 1 hour, we'll refresh 5 minutes early
                self.token_expires = timezone.now() + timezone.timedelta(minutes=55)
                return self.token
            else:
                raise Exception(f"Token request failed: {result.get('statusMessage')}")
                
        except requests.RequestException as e:
            logger.error(f"bKash token request failed: {str(e)}")
            raise Exception(f"Failed to get bKash token: {str(e)}")

    async def create_payment(self, payment_data):
        """Create a payment in bKash"""
        token = await self.get_access_token()
        
        url = f"{self.base_url}/checkout/payment/create"
        headers = self.get_headers(with_token=True)
        
        # Convert USD to BDT (approximate rate)
        amount_bdt = float(payment_data['amount']) * 85
        
        payload = {
            "amount": f"{amount_bdt:.2f}",
            "currency": "BDT",
            "intent": "sale",
            "merchantInvoiceNumber": f"SS_{payment_data['invoice_id']}",
            "merchantAssociationInfo": "StudySync Payment"
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('statusCode') == '0000':
                return {
                    'success': True,
                    'payment_id': result.get('paymentID'),
                    'bkash_url': result.get('bkashURL'),
                    'create_time': result.get('paymentCreateTime'),
                    'amount': result.get('amount'),
                    'currency': result.get('currency')
                }
            else:
                raise Exception(f"Payment creation failed: {result.get('statusMessage')}")
                
        except requests.RequestException as e:
            logger.error(f"bKash payment creation failed: {str(e)}")
            raise Exception(f"Failed to create bKash payment: {str(e)}")

    async def execute_payment(self, payment_id):
        """Execute a bKash payment"""
        token = await self.get_access_token()
        
        url = f"{self.base_url}/checkout/payment/execute/{payment_id}"
        headers = self.get_headers(with_token=True)
        
        try:
            response = requests.post(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('statusCode') == '0000':
                return {
                    'success': True,
                    'payment_id': result.get('paymentID'),
                    'trx_id': result.get('trxID'),
                    'transaction_status': result.get('transactionStatus'),
                    'amount': result.get('amount'),
                    'currency': result.get('currency'),
                    'customer_msisdn': result.get('customerMsisdn'),
                    'payment_execute_time': result.get('paymentExecuteTime')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('statusMessage', 'Payment execution failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"bKash payment execution failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to execute bKash payment: {str(e)}"
            }

    async def query_payment(self, payment_id):
        """Query payment status from bKash"""
        token = await self.get_access_token()
        
        url = f"{self.base_url}/checkout/payment/query/{payment_id}"
        headers = self.get_headers(with_token=True)
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('statusCode') == '0000':
                return {
                    'success': True,
                    'payment_id': result.get('paymentID'),
                    'trx_id': result.get('trxID'),
                    'transaction_status': result.get('transactionStatus'),
                    'amount': result.get('amount'),
                    'currency': result.get('currency')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('statusMessage', 'Payment query failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"bKash payment query failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to query bKash payment: {str(e)}"
            }

    async def refund_payment(self, payment_id, amount, reason="Customer Request"):
        """Refund a bKash payment"""
        token = await self.get_access_token()
        
        url = f"{self.base_url}/checkout/payment/refund"
        headers = self.get_headers(with_token=True)
        
        payload = {
            "paymentID": payment_id,
            "amount": f"{amount:.2f}",
            "trxID": "",
            "sku": "refund",
            "reason": reason
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('statusCode') == '0000':
                return {
                    'success': True,
                    'refund_trx_id': result.get('refundTrxID'),
                    'transaction_status': result.get('transactionStatus'),
                    'amount': result.get('amount'),
                    'completed_time': result.get('completedTime')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('statusMessage', 'Refund failed')
                }
                
        except requests.RequestException as e:
            logger.error(f"bKash refund failed: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to refund bKash payment: {str(e)}"
            }
