from django.urls import include, path
from rest_framework.routers import DefaultRouter

from addresses.views import AddressViewSet
from analytics.views import SummaryView
from billing.views import BillingProfileViewSet
from orders.views import OrderViewSet
from products.views import ProductViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('addresses', AddressViewSet, basename='address')
router.register('billing', BillingProfileViewSet, basename='billing')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    path('accounts/', include('accounts.urls')),
    path('analytics/summary/', SummaryView.as_view(), name='analytics-summary'),
] + router.urls
