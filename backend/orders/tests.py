from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from addresses.models import Address
from billing.models import BillingProfile
from products.models import Product

from .models import Order

DIRECCION = {
    'fullName': 'Ana López', 'street': 'Reforma 10', 'neighborhood': 'Centro',
    'city': 'Puebla', 'state': 'Puebla', 'zip': '72000', 'phone': '222 123 4567',
}


class OrdersTests(APITestCase):
    fixtures = ['products']

    def setUp(self):
        self.ana = User.objects.create_user('ana@correo.com', 'ana@correo.com', 'secreto', first_name='Ana')
        self.client.force_authenticate(self.ana)

    def comprar(self, items, payment=None):
        data = {'items': items, 'address': DIRECCION, 'payment': payment or {'method': 'card', 'last4': '4242'}}
        return self.client.post('/api/orders/', data, format='json')

    def test_crear_pedido_con_envio(self):
        response = self.comprar([{'product': 1, 'quantity': 2}])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['id'].startswith('RX-'))
        self.assertEqual((response.data['subtotal'], response.data['shipping'], response.data['total']), (198.0, 59.0, 257.0))
        self.assertEqual(response.data['payment']['label'], 'Tarjeta de crédito o débito')
        self.assertEqual(response.data['address']['phone'], '2221234567')
        self.assertEqual(Product.objects.get(pk=1).stock, 8)

    def test_envio_gratis(self):
        response = self.comprar([{'product': 14, 'quantity': 3}], {'method': 'cash'})
        self.assertEqual((response.data['subtotal'], response.data['shipping']), (507.0, 0.0))
        self.assertIsNone(response.data['payment']['last4'])

    def test_usa_precio_del_servidor(self):
        response = self.comprar([{'product': 1, 'quantity': 1, 'price': 1}])
        self.assertEqual(response.data['subtotal'], 99.0)

    def test_sin_stock(self):
        response = self.comprar([{'product': 1, 'quantity': 11}])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())

    def test_tarjeta_sin_digitos(self):
        response = self.comprar([{'product': 1, 'quantity': 1}], {'method': 'card'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Address.objects.exists())

    def test_carrito_vacio(self):
        self.assertEqual(self.comprar([]).status_code, status.HTTP_400_BAD_REQUEST)

    def test_cada_usuario_ve_sus_pedidos(self):
        code = self.comprar([{'product': 1, 'quantity': 1}]).data['id']
        self.assertEqual(len(self.client.get('/api/orders/').data), 1)
        self.assertEqual(self.client.get(f'/api/orders/{code}/').data['id'], code)

        luis = User.objects.create_user('luis@correo.com', 'luis@correo.com', 'secreto')
        self.client.force_authenticate(luis)
        self.assertEqual(self.client.get('/api/orders/').data, [])
        self.assertEqual(self.client.get(f'/api/orders/{code}/').status_code, status.HTTP_404_NOT_FOUND)

    def test_pedido_sin_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.comprar([{'product': 1, 'quantity': 1}]).status_code, status.HTTP_401_UNAUTHORIZED)


class AddressesBillingTests(APITestCase):
    def setUp(self):
        self.ana = User.objects.create_user('ana@correo.com', 'ana@correo.com', 'secreto')
        self.client.force_authenticate(self.ana)

    def test_direcciones(self):
        response = self.client.post('/api/addresses/', DIRECCION, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post('/api/addresses/', {**DIRECCION, 'zip': '12'}, format='json')
        self.assertEqual(response.data['zip'][0], 'El código postal debe tener 5 dígitos.')
        self.assertEqual(len(self.client.get('/api/addresses/').data), 1)

    def test_metodos_de_pago(self):
        response = self.client.post('/api/billing/', {'method': 'transfer'}, format='json')
        self.assertEqual(response.data['label'], 'Transferencia SPEI')
        self.assertEqual(BillingProfile.objects.get().user, self.ana)
