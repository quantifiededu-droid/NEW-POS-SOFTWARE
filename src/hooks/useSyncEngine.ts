import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { getSupabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useSyncEngine = () => {
  const { profile } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let syncInterval: any;

    const syncOutgoing = async () => {
      const queue = await db.syncQueue.toArray();
      if (queue.length === 0) return;

      const supabase = getSupabase();
      for (const item of queue) {
        try {
          if (item.type === 'sale') {
            const { sale, items } = item.data;
            const { error: saleError } = await supabase.from('sales').upsert(sale);
            if (saleError) throw saleError;
            const { error: itemsError } = await supabase.from('sale_items').upsert(items);
            if (itemsError) throw itemsError;
            await db.sales.update(sale.id, { synced: true });
          } else if (item.type === 'product_update') {
            const { product } = item.data;
            const { error } = await supabase.from('products').upsert(product);
            if (error) throw error;
          } else if (item.type === 'product_delete') {
            const { id } = item.data;
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
          } else if (item.type === 'expense') {
            const { expense } = item.data;
            const { error } = await supabase.from('expenses').upsert(expense);
            if (error) throw error;
          }
          await db.syncQueue.delete(item.id!);
        } catch (itemErr) {
          console.error("Item Sync Error:", itemErr);
        }
      }
    };

    const syncIncoming = async () => {
      if (!profile?.business_id) return;
      const supabase = getSupabase();
      
      const { data: serverProducts, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', profile.business_id);
      
      if (productError) throw productError;
      
      if (serverProducts) {
        await db.products.bulkPut(serverProducts);
      }
    };

    const sync = async () => {
      if (isSyncing || !navigator.onLine || !profile?.business_id) return;

      setIsSyncing(true);
      setError(null);

      try {
        await syncOutgoing();
        await syncIncoming();
        setLastSynced(new Date());
      } catch (err: any) {
        console.error("Sync Error:", err);
        setError(err.message);
      } finally {
        setIsSyncing(false);
      }
    };

    if (profile?.business_id) {
        sync();
        syncInterval = setInterval(sync, 30000);
    }

    return () => clearInterval(syncInterval);
  }, [profile?.business_id, isSyncing]);

  return { isSyncing, lastSynced, error };
};
