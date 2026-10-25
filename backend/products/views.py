from rest_framework import permissions, viewsets

from analytics.models import ProductView

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        products = Product.objects.filter(active=True)
        category = self.request.query_params.get('category')
        if category and category != 'Todos':
            products = products.filter(category=category)
        return products

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        user = request.user if request.user.is_authenticated else None
        ProductView.objects.create(product_id=response.data['id'], user=user)
        return response
