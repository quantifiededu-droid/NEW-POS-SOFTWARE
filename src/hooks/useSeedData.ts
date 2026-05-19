import { useEffect } from 'react';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export const useSeedData = () => {
  useEffect(() => {
    const seed = async () => {
      const count = await db.products.count();
      if (count === 0) {
        await db.products.bulkAdd([
          {
            id: uuidv4(),
            business_id: 'test-biz',
            name: 'Coca-Cola 500ml',
            price: 5.50,
            cost_price: 3.50,
            stock_quantity: 120,
            min_stock_level: 20,
            barcode: '123456',
            is_active: true,
            updated_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            business_id: 'test-biz',
            name: 'Milo 400g',
            price: 25.00,
            cost_price: 18.00,
            stock_quantity: 45,
            min_stock_level: 10,
            barcode: '654321',
            is_active: true,
            updated_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            business_id: 'test-biz',
            name: 'Gari (1 Paint Rubber)',
            price: 45.00,
            cost_price: 30.00,
            stock_quantity: 15,
            min_stock_level: 5,
            barcode: '999888',
            is_active: true,
            updated_at: new Date().toISOString()
          }
        ]);
      }
    };
    seed();
  }, []);
};
