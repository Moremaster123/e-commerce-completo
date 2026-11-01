import secrets
import time

from django.db import transaction
from rest_framework import serializers

from accounts.serializers import public_user
from addresses.serializers import AddressSerializer
from billing.serializers import BillingProfileSerializer
from products.models import Product

from .models import Order, OrderItem, calculate_shipping


def new_order_code():
    millis = int(time.time() * 1000)
    digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    code = ''
    while millis:
        millis, rest = divmod(millis, 36)
        code = digits[rest] + code
    return f'RX-{code}{secrets.choice(digits)}'


class OrderItemInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(active=True))
    quantity = serializers.IntegerField(min_value=1, max_value=20)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False)
    address = AddressSerializer()
    payment = BillingProfileSerializer()

    def validate_items(self, items):
        for item in items:
            if item['quantity'] > item['product'].stock:
                raise serializers.ValidationError(f'No hay suficiente stock de {item["product"].name}.')
        return items

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        address = AddressSerializer().create({**validated_data['address'], 'user': user})
        billing = BillingProfileSerializer().create({**validated_data['payment'], 'user': user})

        subtotal = sum(item['product'].price * item['quantity'] for item in validated_data['items'])
        shipping = calculate_shipping(subtotal)
        order = Order.objects.create(
            code=new_order_code(),
            user=user,
            address=address,
            billing_profile=billing,
            subtotal=subtotal,
            shipping=shipping,
            total=subtotal + shipping,
            status='pending' if billing.method == 'mercadopago' else 'paid',
        )
        for item in validated_data['items']:
            product = item['product']
            OrderItem.objects.create(
                order=order, product=product, name=product.name,
                price=product.price, quantity=item['quantity'],
            )
            product.stock -= item['quantity']
            product.save(update_fields=['stock'])
        return order

    def to_representation(self, order):
        return OrderSerializer(order).data


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['code']

    def to_representation(self, order):
        return {
            'id': order.code,
            'date': order.created_at.isoformat(),
            'status': order.get_status_display(),
            'statusCode': order.status,
            'paymentStatus': order.mp_status or None,
            'checkoutUrl': order.mp_checkout_url if order.status == 'pending' and order.mp_checkout_url else None,
            'customer': public_user(order.user),
            'items': [
                {'id': item.product_id, 'name': item.name, 'price': float(item.price), 'quantity': item.quantity}
                for item in order.items.all()
            ],
            'subtotal': float(order.subtotal),
            'shipping': float(order.shipping),
            'total': float(order.total),
            'address': AddressSerializer(order.address).data if order.address else None,
            'payment': BillingProfileSerializer(order.billing_profile).data if order.billing_profile else None,
        }
