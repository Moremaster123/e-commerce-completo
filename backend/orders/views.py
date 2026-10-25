from rest_framework import mixins, viewsets

from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'code'

    def get_queryset(self):
        return self.request.user.orders.select_related(
            'user', 'address', 'billing_profile'
        ).prefetch_related('items')

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == 'create' else OrderSerializer
