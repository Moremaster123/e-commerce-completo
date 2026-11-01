from django.db import transaction
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from . import mercadopago
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer

PAYMENT_ERROR = 'No pudimos iniciar el pago con Mercado Pago. Intenta de nuevo en unos minutos.'


class OrderViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = 'code'

    def get_queryset(self):
        return self.request.user.orders.select_related(
            'user', 'address', 'billing_profile'
        ).prefetch_related('items')

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == 'create' else OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                order = serializer.save()
                if order.billing_profile.method == 'mercadopago':
                    mercadopago.create_preference(order)
        except mercadopago.MercadoPagoError:
            return Response({'detail': PAYMENT_ERROR}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='pago')
    def sync_payment(self, request, code=None):
        order = self.get_object()
        payment_id = str(request.data.get('payment_id', ''))

        if not payment_id.isdigit():
            return Response({'payment_id': 'Indica el número de pago de Mercado Pago.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = mercadopago.get_payment(payment_id)
        except mercadopago.MercadoPagoError:
            return Response({'detail': 'No pudimos consultar el pago. Intenta de nuevo.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        order = mercadopago.apply_payment(order, payment)
        return Response(OrderSerializer(self.get_queryset().get(pk=order.pk)).data)


class MercadoPagoWebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data.get('data') if isinstance(request.data.get('data'), dict) else {}
        topic = request.query_params.get('type') or request.query_params.get('topic') or request.data.get('type')
        payment_id = request.query_params.get('data.id') or data.get('id') or request.query_params.get('id')

        if topic != 'payment' or not str(payment_id or '').isdigit():
            return Response(status=status.HTTP_200_OK)

        if not mercadopago.valid_signature(request, payment_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        try:
            payment = mercadopago.get_payment(payment_id)
        except mercadopago.MercadoPagoError:
            return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE)

        order = Order.objects.filter(code=payment.get('external_reference')).first()
        if order:
            mercadopago.apply_payment(order, payment)

        return Response(status=status.HTTP_200_OK)
