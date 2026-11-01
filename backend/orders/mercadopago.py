import hashlib
import hmac
import json
import urllib.error
import urllib.request
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import F

from products.models import Product

API_URL = 'https://api.mercadopago.com'

PAID = {'approved'}
CANCELLED = {'cancelled', 'refunded', 'charged_back'}


class MercadoPagoError(Exception):
    pass


def _request(method, path, data=None):
    token = settings.MERCADOPAGO_ACCESS_TOKEN
    if not token:
        raise MercadoPagoError('Falta configurar MERCADOPAGO_ACCESS_TOKEN.')

    body = json.dumps(data).encode('utf-8') if data is not None else None
    request = urllib.request.Request(
        API_URL + path,
        data=body,
        method=method,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        raise MercadoPagoError(f'Mercado Pago respondió {error.code}.') from error
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        raise MercadoPagoError('No se pudo conectar con Mercado Pago.') from error


def is_test_mode():
    return settings.MERCADOPAGO_ACCESS_TOKEN.startswith('TEST-')


def preference_data(order):
    return_url = f'{settings.FRONTEND_URL}/confirmacion?pedido={order.code}'
    data = {
        'items': [
            {
                'id': str(item.product_id),
                'title': item.name,
                'quantity': item.quantity,
                'unit_price': float(item.price),
                'currency_id': 'MXN',
            }
            for item in order.items.all()
        ],
        'payer': {'name': order.user.first_name, 'email': order.user.email},
        'external_reference': order.code,
        'back_urls': {'success': return_url, 'failure': return_url, 'pending': return_url},
        'statement_descriptor': 'ROMXNO',
    }
    if order.shipping:
        data['shipments'] = {'mode': 'not_specified', 'cost': float(order.shipping)}
    if settings.FRONTEND_URL.startswith('https://'):
        data['auto_return'] = 'approved'
    if settings.BACKEND_URL.startswith('https://'):
        data['notification_url'] = f'{settings.BACKEND_URL}/api/payments/webhook/'
    return data


def create_preference(order):
    preference = _request('POST', '/checkout/preferences', preference_data(order))
    url_key = 'sandbox_init_point' if is_test_mode() else 'init_point'
    order.mp_preference_id = preference['id']
    order.mp_checkout_url = preference.get(url_key) or preference['init_point']
    order.save(update_fields=['mp_preference_id', 'mp_checkout_url'])
    return order


def get_payment(payment_id):
    return _request('GET', f'/v1/payments/{int(payment_id)}')


def _restore_stock(order):
    for item in order.items.all():
        Product.objects.filter(pk=item.product_id).update(stock=F('stock') + item.quantity)


@transaction.atomic
def apply_payment(order, payment):
    if payment.get('external_reference') != order.code:
        return order

    order = type(order).objects.select_for_update().get(pk=order.pk)
    status = payment.get('status', '')
    amount = Decimal(str(payment.get('transaction_amount', 0)))

    order.mp_payment_id = str(payment.get('id', ''))
    order.mp_status = status

    if status in PAID and amount >= order.total:
        if order.status == 'pending':
            order.status = 'paid'
    elif status in CANCELLED and order.status == 'pending':
        order.status = 'cancelled'
        _restore_stock(order)

    order.save(update_fields=['mp_payment_id', 'mp_status', 'status'])
    return order


def valid_signature(request, data_id):
    secret = settings.MERCADOPAGO_WEBHOOK_SECRET
    if not secret:
        return True

    parts = dict(
        part.strip().split('=', 1)
        for part in request.headers.get('x-signature', '').split(',')
        if '=' in part
    )
    ts, received = parts.get('ts'), parts.get('v1')
    if not ts or not received:
        return False

    manifest = f'id:{str(data_id).lower()};request-id:{request.headers.get("x-request-id", "")};ts:{ts};'
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received)
