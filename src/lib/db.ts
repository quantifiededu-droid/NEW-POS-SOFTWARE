import Dexie, { type Table } from 'dexie';
import { Product, Sale, SaleItem, Category, SyncQueueItem, Expense } from '../types';

export class ClemtrixDB extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  categories!: Table<Category>;
  syncQueue!: Table<SyncQueueItem>;
  expenses!: Table<Expense>;

  constructor() {
    super('ClemtrixDB');
    this.version(1).stores({
      products: 'id, business_id, name, barcode, category_id',
      sales: 'id, business_id, user_id, created_at, synced',
      saleItems: 'id, sale_id, product_id',
      categories: 'id, business_id, name',
      syncQueue: '++id, type, created_at',
      expenses: 'id, business_id, user_id, category, date'
    });
  }
}

export const db = new ClemtrixDB();
