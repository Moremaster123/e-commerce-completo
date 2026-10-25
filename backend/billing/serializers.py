import re

from rest_framework import serializers

from .models import BillingProfile


class BillingProfileSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source='get_method_display', read_only=True)
    last4 = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = BillingProfile
        fields = ['id', 'method', 'label', 'last4']

    def validate(self, data):
        last4 = data.get('last4') or ''
        if data.get('method') == 'card':
            if not re.fullmatch(r'\d{4}', last4):
                raise serializers.ValidationError({'last4': 'Indica los últimos 4 dígitos de la tarjeta.'})
        else:
            last4 = ''
        data['last4'] = last4
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['last4'] = data['last4'] or None
        return data
