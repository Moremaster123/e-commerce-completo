from django.contrib import admin

from .models import BillingProfile


@admin.register(BillingProfile)
class BillingProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'method', 'last4', 'created_at')
    list_filter = ('method',)
    search_fields = ('user__email',)
