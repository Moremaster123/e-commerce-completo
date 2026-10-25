from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from orders.tests import DIRECCION


class AnalyticsTests(APITestCase):
    fixtures = ['products']

    def test_solo_admin(self):
        cliente = User.objects.create_user('cliente@correo.com', 'cliente@correo.com', 'secreto')
        self.client.force_authenticate(cliente)
        self.assertEqual(self.client.get('/api/analytics/summary/').status_code, status.HTTP_403_FORBIDDEN)

    def test_resumen(self):
        cliente = User.objects.create_user('cliente@correo.com', 'cliente@correo.com', 'secreto')
        self.client.force_authenticate(cliente)
        self.client.get('/api/products/3/')
        self.client.post('/api/orders/', {
            'items': [{'product': 3, 'quantity': 2}, {'product': 1, 'quantity': 1}],
            'address': DIRECCION, 'payment': {'method': 'cash'},
        }, format='json')

        admin = User.objects.create_superuser('admin', 'admin@correo.com', 'secreto')
        self.client.force_authenticate(admin)
        data = self.client.get('/api/analytics/summary/').data
        self.assertEqual((data['orders'], data['revenue'], data['customers']), (1, 436.0, 1))
        self.assertEqual(data['top_products'][0], {'name': 'Vino Tinto', 'sold': 2})
        self.assertEqual(data['most_viewed'], [{'name': 'Vino Tinto', 'views': 1}])
