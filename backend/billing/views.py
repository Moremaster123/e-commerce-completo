from rest_framework import viewsets

from .serializers import BillingProfileSerializer


class BillingProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BillingProfileSerializer

    def get_queryset(self):
        return self.request.user.billing_profiles.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
