from rest_framework import viewsets

from .serializers import AddressSerializer


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer

    def get_queryset(self):
        return self.request.user.addresses.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
