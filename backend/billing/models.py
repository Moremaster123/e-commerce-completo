from django.contrib.auth.models import User
from django.db import models

PAYMENT_METHODS = [
    ('card', 'Tarjeta de crédito o débito'),
    ('transfer', 'Transferencia SPEI'),
    ('cash', 'Pago en efectivo en OXXO'),
    ('mercadopago', 'Mercado Pago'),
]


class BillingProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billing_profiles')
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    last4 = models.CharField(max_length=4, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        label = self.get_method_display()
        return f'{label} terminada en {self.last4}' if self.last4 else label
