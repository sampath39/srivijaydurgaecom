import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductCard from './ProductCard';

// Dummy store for Redux provider
const store = configureStore({
  reducer: {
    cart: (state = { items: [] }) => state,
    wishlist: (state = { items: [] }) => state,
  }
});

export default {
  title: 'UI/ProductCard',
  component: ProductCard,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <BrowserRouter>
          <div className="w-64 p-4 bg-gray-50 dark:bg-dark-900">
            <Story />
          </div>
        </BrowserRouter>
      </Provider>
    ),
  ],
};

const mockProduct = {
  id: '1',
  name: 'Premium Silk Saree',
  slug: 'premium-silk-saree',
  price: 5000,
  discount_price: 3999,
  images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400'],
  avg_rating: 4.5,
  review_count: 120,
  sold_count: 50,
  stock_count: 10,
  is_flash_sale: true,
  categories: { name: 'Sarees', slug: 'sarees' }
};

export const Default = {
  args: {
    product: mockProduct,
    index: 0
  }
};

export const OutOfStock = {
  args: {
    product: {
      ...mockProduct,
      stock_count: 0
    },
    index: 1
  }
};
