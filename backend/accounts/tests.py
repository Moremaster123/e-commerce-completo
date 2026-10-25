from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

REGISTRO = {'name': 'Ana López', 'email': 'Ana@Correo.com', 'password': 'secreto'}


class AccountsTests(APITestCase):
    def test_registro(self):
        response = self.client.post('/api/accounts/register/', REGISTRO, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user'], {'name': 'Ana López', 'email': 'ana@correo.com'})
        self.assertTrue(response.data['token'])
        user = User.objects.get(email='ana@correo.com')
        self.assertTrue(user.check_password('secreto'))
        self.assertTrue(hasattr(user, 'profile'))

    def test_registro_correo_repetido(self):
        self.client.post('/api/accounts/register/', REGISTRO, format='json')
        response = self.client.post('/api/accounts/register/', REGISTRO, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['email'][0], 'Ya existe una cuenta con ese correo.')

    def test_registro_contrasena_corta(self):
        response = self.client.post('/api/accounts/register/', {**REGISTRO, 'password': '123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_y_perfil(self):
        self.client.post('/api/accounts/register/', REGISTRO, format='json')
        response = self.client.post('/api/accounts/login/', {'email': 'ana@correo.com', 'password': 'secreto'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {response.data["token"]}')
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.data['name'], 'Ana López')

    def test_login_incorrecto(self):
        self.client.post('/api/accounts/register/', REGISTRO, format='json')
        response = self.client.post('/api/accounts/login/', {'email': 'ana@correo.com', 'password': 'otra'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['non_field_errors'][0], 'Correo o contraseña incorrectos.')

    def test_perfil_sin_login(self):
        self.assertEqual(self.client.get('/api/accounts/me/').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        token = self.client.post('/api/accounts/register/', REGISTRO, format='json').data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(self.client.post('/api/accounts/logout/').status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get('/api/accounts/me/').status_code, status.HTTP_401_UNAUTHORIZED)
