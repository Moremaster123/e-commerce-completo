from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models

from addresses.models import Address
from billing.models import BillingProfile
from products.models import Product

FREE_SHIPPING_FROM = Decimal('499')
SHIPPING_COST = Decimal('59')

STATUS_CHOICES = [
    ('created', 'Creada'),
    ('pending', 'Pendiente de pago'),
    ('paid', 'Pagada'),
    ('shipped', 'Enviada'),
    ('cancelled', 'Cancelada'),
]


def calculate_shipping(subtotal):
    return Decimal('0') if subtotal == 0 or subtotal >= FREE_SHIPPING_FROM else SHIPPING_COST


class Order(models.Model):
    code = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    billing_profile = models.ForeignKey(BillingProfile, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='paid')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    mp_preference_id = models.CharField(max_length=100, blank=True)
    mp_checkout_url = models.URLField(max_length=500, blank=True)
    mp_payment_id = models.CharField(max_length=50, blank=True)
    mp_status = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f'{self.quantity} x {self.name}'
