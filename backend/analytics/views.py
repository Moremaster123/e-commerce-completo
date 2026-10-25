from django.contrib.auth.models import User
from django.db.models import Count, Sum
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, OrderItem
from products.models import Product


class SummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        orders = Order.objects.exclude(status='cancelled')
        top_products = (
            OrderItem.objects.filter(order__in=orders)
            .values('name')
            .annotate(sold=Sum('quantity'))
            .order_by('-sold')[:5]
        )
        most_viewed = (
            Product.objects.annotate(total_views=Count('views'))
            .filter(total_views__gt=0)
            .order_by('-total_views')
            .values('name', 'total_views')[:5]
        )
        return Response({
            'orders': orders.count(),
            'revenue': float(orders.aggregate(total=Sum('total'))['total'] or 0),
            'customers': User.objects.filter(orders__in=orders).distinct().count(),
            'top_products': list(top_products),
            'most_viewed': [{'name': p['name'], 'views': p['total_views']} for p in most_viewed],
        })
