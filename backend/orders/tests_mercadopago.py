import hashlib
import hmac
from unittest import mock

from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product

from . import mercadopago
from .models import Order

DIRECCION = {
    'fullName': 'Ana López', 'street': 'Reforma 10', 'neighborhood': 'Centro',
    'city': 'Puebla', 'state': 'Puebla', 'zip': '72000', 'phone': '222 123 4567',
}

PREFERENCIA = {
    'id': '123-abc',
    'init_point': 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=123-abc',
    'sandbox_init_point': 'https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=123-abc',
}

MP = override_settings(
    MERCADOPAGO_ACCESS_TOKEN='TEST-123',
    MERCADOPAGO_WEBHOOK_SECRET='',
    FRONTEND_URL='https://moremaster123.github.io/Tienda-Llaveros',
    BACKEND_URL='https://romxno-api.onrender.com',
)


def pago(order, estado='approved', monto=None, pago_id=555):
    return {
        'id': pago_id,
        'status': estado,
        'external_reference': order.code,
        'transaction_amount': float(order.total if monto is None else monto),
    }


@MP
class PagoMercadoPagoTests(APITestCase):
    fixtures = ['products']

    def setUp(self):
        self.ana = User.objects.create_user('ana@correo.com', 'ana@correo.com', 'secreto', first_name='Ana')
        self.client.force_authenticate(self.ana)

    def comprar(self, items=None):
        data = {'items': items or [{'product': 1, 'quantity': 2}], 'address': DIRECCION, 'payment': {'method': 'mercadopago'}}
        return self.client.post('/api/orders/', data, format='json')

    @mock.patch('orders.mercadopago._request', return_value=PREFERENCIA)
    def test_crea_pedido_pendiente_con_link_de_pago(self, request):
        response = self.comprar()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['statusCode'], 'pending')
        self.assertEqual(response.data['payment']['label'], 'Mercado Pago')
        self.assertEqual(response.data['checkoutUrl'], PREFERENCIA['sandbox_init_point'])

        metodo, ruta, datos = request.call_args.args
        self.assertEqual((metodo, ruta), ('POST', '/checkout/preferences'))
        self.assertEqual(datos['items'][0]['unit_price'], 99.0)
        self.assertEqual(datos['shipments']['cost'], 59.0)
        self.assertEqual(datos['external_reference'], response.data['id'])
        self.assertEqual(datos['auto_return'], 'approved')
        self.assertEqual(datos['notification_url'], 'https://romxno-api.onrender.com/api/payments/webhook/')
        self.assertIn(f'pedido={response.data["id"]}', datos['back_urls']['success'])

    @override_settings(MERCADOPAGO_ACCESS_TOKEN='APP_USR-123')
    @mock.patch('orders.mercadopago._request', return_value=PREFERENCIA)
    def test_con_credenciales_de_produccion_usa_init_point(self, request):
        self.assertEqual(self.comprar().data['checkoutUrl'], PREFERENCIA['init_point'])

    @mock.patch('orders.mercadopago._request', side_effect=mercadopago.MercadoPagoError('caido'))
    def test_si_mercado_pago_falla_no_se_guarda_nada(self, request):
        response = self.comprar()

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertFalse(Order.objects.exists())
        self.assertEqual(Product.objects.get(pk=1).stock, 10)

    @override_settings(MERCADOPAGO_ACCESS_TOKEN='')
    def test_sin_credenciales_responde_error(self):
        self.assertEqual(self.comprar().status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def crear_pedido(self):
        with mock.patch('orders.mercadopago._request', return_value=PREFERENCIA):
            return Order.objects.get(code=self.comprar().data['id'])

    def test_pago_aprobado_marca_el_pedido_como_pagado(self):
        order = self.crear_pedido()

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order)):
            response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': '555'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['statusCode'], 'paid')
        self.assertEqual(response.data['paymentStatus'], 'approved')
        self.assertIsNone(response.data['checkoutUrl'])

    def test_pago_con_monto_menor_no_se_acepta(self):
        order = self.crear_pedido()

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order, monto=1)):
            response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': '555'}, format='json')

        self.assertEqual(response.data['statusCode'], 'pending')

    def test_pago_de_otro_pedido_no_cambia_nada(self):
        order = self.crear_pedido()
        ajeno = {**pago(order), 'external_reference': 'RX-OTRO'}

        with mock.patch('orders.mercadopago.get_payment', return_value=ajeno):
            response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': '555'}, format='json')

        self.assertEqual(response.data['statusCode'], 'pending')
        self.assertIsNone(response.data['paymentStatus'])

    def test_pago_rechazado_permite_reintentar(self):
        order = self.crear_pedido()

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order, 'rejected')):
            response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': '555'}, format='json')

        self.assertEqual(response.data['statusCode'], 'pending')
        self.assertEqual(response.data['paymentStatus'], 'rejected')
        self.assertEqual(response.data['checkoutUrl'], PREFERENCIA['sandbox_init_point'])

    def test_pago_cancelado_regresa_el_stock(self):
        order = self.crear_pedido()
        self.assertEqual(Product.objects.get(pk=1).stock, 8)

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order, 'cancelled')):
            response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': '555'}, format='json')

        self.assertEqual(response.data['statusCode'], 'cancelled')
        self.assertEqual(Product.objects.get(pk=1).stock, 10)

    def test_otro_usuario_no_puede_consultar_el_pago(self):
        order = self.crear_pedido()
        luis = User.objects.create_user('luis@correo.com', 'luis@correo.com', 'secreto')
        self.client.force_authenticate(luis)

        response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': '555'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_payment_id_invalido(self):
        order = self.crear_pedido()
        response = self.client.post(f'/api/orders/{order.code}/pago/', {'payment_id': 'abc'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_webhook_actualiza_el_pedido(self):
        order = self.crear_pedido()
        self.client.force_authenticate(None)

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order)) as get_payment:
            response = self.client.post('/api/payments/webhook/?type=payment&data.id=555', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        get_payment.assert_called_once_with('555')
        order.refresh_from_db()
        self.assertEqual((order.status, order.mp_payment_id), ('paid', '555'))

    def test_webhook_con_datos_en_el_cuerpo(self):
        order = self.crear_pedido()

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order)):
            self.client.post('/api/payments/webhook/', {'type': 'payment', 'data': {'id': '555'}}, format='json')

        order.refresh_from_db()
        self.assertEqual(order.status, 'paid')

    def test_webhook_ignora_otros_avisos(self):
        with mock.patch('orders.mercadopago.get_payment') as get_payment:
            response = self.client.post('/api/payments/webhook/?type=merchant_order&data.id=1', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        get_payment.assert_not_called()

    @override_settings(MERCADOPAGO_WEBHOOK_SECRET='secreto-webhook')
    def test_webhook_valida_la_firma(self):
        order = self.crear_pedido()
        url = '/api/payments/webhook/?type=payment&data.id=555'

        with mock.patch('orders.mercadopago.get_payment', return_value=pago(order)):
            sin_firma = self.client.post(url, {}, format='json', HTTP_X_SIGNATURE='ts=1,v1=malo', HTTP_X_REQUEST_ID='req-1')

            firma = hmac.new(b'secreto-webhook', b'id:555;request-id:req-1;ts:1;', hashlib.sha256).hexdigest()
            con_firma = self.client.post(url, {}, format='json', HTTP_X_SIGNATURE=f'ts=1,v1={firma}', HTTP_X_REQUEST_ID='req-1')

        self.assertEqual(sin_firma.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(con_firma.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'paid')
