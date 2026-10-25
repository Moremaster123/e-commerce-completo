from django.contrib import admin

from .models import Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'street', 'city', 'state', 'zip')
    search_fields = ('full_name', 'user__email', 'city')
