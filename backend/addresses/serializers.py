import re

from rest_framework import serializers

from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='full_name', min_length=3, max_length=100)
    phone = serializers.CharField(max_length=20)

    class Meta:
        model = Address
        fields = ['id', 'fullName', 'street', 'neighborhood', 'city', 'state', 'zip', 'phone']

    def validate_zip(self, value):
        if not re.fullmatch(r'\d{5}', value.strip()):
            raise serializers.ValidationError('El código postal debe tener 5 dígitos.')
        return value.strip()

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) != 10:
            raise serializers.ValidationError('El teléfono debe tener 10 dígitos.')
        return digits
