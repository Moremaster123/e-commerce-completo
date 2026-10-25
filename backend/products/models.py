from django.db import models

CATEGORIES = [
    ('Anime y manga', 'Anime y manga'),
    ('Streetwear', 'Streetwear'),
]


class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=30, choices=CATEGORIES)
    image = models.CharField(max_length=100, blank=True)
    stock = models.PositiveIntegerField(default=10)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name
