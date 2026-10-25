from rest_framework import status
from rest_framework.test import APITestCase

from analytics.models import ProductView

from .models import Product


class ProductsTests(APITestCase):
    fixtures = ['products']

    def test_lista_publica(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 20)
        self.assertEqual(response.data[0]['name'], 'Tinta Negra')
        self.assertEqual(response.data[0]['price'], 99.0)

    def test_filtro_por_categoria(self):
        response = self.client.get('/api/products/', {'category': 'Anime y manga'})
        self.assertEqual(len(response.data), 7)
        self.assertTrue(all(p['category'] == 'Anime y manga' for p in response.data))

    def test_no_muestra_inactivos(self):
        Product.objects.filter(pk=1).update(active=False)
        self.assertEqual(len(self.client.get('/api/products/').data), 19)

    def test_detalle_registra_visita(self):
        response = self.client.get('/api/products/2/')
        self.assertEqual(response.data['name'], 'Racing Rojo')
        self.assertEqual(ProductView.objects.filter(product_id=2).count(), 1)

    def test_solo_lectura(self):
        response = self.client.post('/api/products/', {'name': 'x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
