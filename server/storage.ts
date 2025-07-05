import { inventoryItems, type InventoryItem, type InsertInventoryItem, type UpdateInventoryItem, type SearchFilters, users, type User, type InsertUser, searchResults, type SearchResult, type InsertSearchResult, deletedItems, type DeletedItem } from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, gte, lte, and, or, sql, desc, asc, isNotNull, ne, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Inventory methods
  getAllInventoryItems(filters?: SearchFilters, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{ items: InventoryItem[], total: number }>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItemByBarcode(barcode: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: UpdateInventoryItem): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  bulkDeleteInventoryItems(itemIds: number[]): Promise<number>;
  bulkUpdateInventoryItems(itemIds: number[], data: Partial<InventoryItem>): Promise<number>;
  getInventoryStats(): Promise<{
    totalItems: number;
    availableItems: number;
    unavailableItems: number;
    totalValue: number;
  }>;
  getDepartments(): Promise<string[]>;
  getCategories(): Promise<string[]>;
  getConditions(): Promise<string[]>;
  
  // Search results methods
  addSearchResult(result: InsertSearchResult): Promise<SearchResult>;
  getSearchResults(): Promise<SearchResult[]>;
  deleteSearchResult(id: number): Promise<boolean>;
  clearSearchResults(): Promise<void>;
  
  // Deleted items methods for undo/restore functionality
  getDeletedItems(): Promise<DeletedItem[]>;
  restoreDeletedItem(deletedItemId: number): Promise<InventoryItem | undefined>;
  permanentlyDeleteItem(deletedItemId: number): Promise<boolean>;
  bulkRestoreDeletedItems(deletedItemIds: number[]): Promise<number>;
  bulkPermanentlyDeleteItems(deletedItemIds: number[]): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;    
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Inventory methods
  async getAllInventoryItems(filters?: SearchFilters, page = 1, limit = 25, sortBy = 'date_ajouter', sortOrder: 'asc' | 'desc' = 'desc'): Promise<{ items: InventoryItem[], total: number }> {
    let whereConditions: any[] = [];

    if (filters) {
      // Full-text search across all fields
      if (filters.fullTextSearch) {
        const searchTerm = filters.fullTextSearch.toLowerCase();
        whereConditions.push(
          or(
            ilike(inventoryItems.designation, `%${searchTerm}%`),
            ilike(inventoryItems.description, `%${searchTerm}%`),
            ilike(inventoryItems.code_barre, `%${searchTerm}%`),
            ilike(inventoryItems.departement, `%${searchTerm}%`),
            ilike(inventoryItems.categorie, `%${searchTerm}%`),
            ilike(inventoryItems.condition, `%${searchTerm}%`),
            ilike(inventoryItems.beneficiaire, `%${searchTerm}%`),
            ilike(inventoryItems.num_bureau, `%${searchTerm}%`),
            ilike(inventoryItems.num_inventaire, `%${searchTerm}%`),
            ilike(inventoryItems.num_serie, `%${searchTerm}%`),
            sql`CAST(${inventoryItems.custom_fields} AS TEXT) ILIKE ${'%' + searchTerm + '%'}`
          )
        );
      }

      if (filters.code_barre?.value) {
        const { operator, value } = filters.code_barre;
        switch (operator) {
          case 'equals':
            whereConditions.push(eq(inventoryItems.code_barre, value));
            break;
          case 'contains':
            whereConditions.push(ilike(inventoryItems.code_barre, `%${value}%`));
            break;
          case 'startsWith':
            whereConditions.push(ilike(inventoryItems.code_barre, `${value}%`));
            break;
        }
      }

      if (filters.departement) {
        whereConditions.push(eq(inventoryItems.departement, filters.departement));
      }

      if (filters.categorie) {
        whereConditions.push(eq(inventoryItems.categorie, filters.categorie));
      }

      if (filters.condition) {
        whereConditions.push(eq(inventoryItems.condition, filters.condition));
      }

      if (filters.prix_min !== undefined) {
        whereConditions.push(gte(inventoryItems.prix, filters.prix_min.toString()));
      }

      if (filters.prix_max !== undefined) {
        whereConditions.push(lte(inventoryItems.prix, filters.prix_max.toString()));
      }

      if (filters.beneficiaire) {
        whereConditions.push(ilike(inventoryItems.beneficiaire, `%${filters.beneficiaire}%`));
      }

      if (filters.num_bureau) {
        whereConditions.push(ilike(inventoryItems.num_bureau, `%${filters.num_bureau}%`));
      }

      if (filters.designation) {
        whereConditions.push(ilike(inventoryItems.designation, `%${filters.designation}%`));
      }

      if (filters.date_ajouter) {
        const date = new Date(filters.date_ajouter);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        whereConditions.push(
          and(
            gte(inventoryItems.date_ajouter, date),
            lte(inventoryItems.date_ajouter, nextDay)
          )
        );
      }
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(whereClause);
    
    const total = Number(totalResult[0].count);

    // Get paginated results
    const orderByClause = sortOrder === 'asc' 
      ? asc(inventoryItems[sortBy as keyof typeof inventoryItems] as any)
      : desc(inventoryItems[sortBy as keyof typeof inventoryItems] as any);

    // Get items with conditional pagination
    let items;
    if (limit > 0 && limit < 9999) {
      // Apply pagination
      const offset = (page - 1) * limit;
      items = await db
        .select()
        .from(inventoryItems)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    } else {
      // Show all items (no pagination)
      items = await db
        .select()
        .from(inventoryItems)
        .where(whereClause)
        .orderBy(orderByClause);
    }

    return { items, total };
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async getInventoryItemByBarcode(barcode: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.code_barre, barcode));
    return item || undefined;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [createdItem] = await db
      .insert(inventoryItems)
      .values({
        ...item,
        date_ajouter: new Date(),
        date_modification: new Date(),
      })
      .returning();
    return createdItem;
  }

  async updateInventoryItem(id: number, item: UpdateInventoryItem): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        ...item,
        date_modification: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    try {
      // First get the item to be deleted
      const itemToDelete = await this.getInventoryItem(id);
      if (!itemToDelete) {
        return false;
      }

      // Move the item to deleted_items table
      await db.insert(deletedItems).values({
        original_id: itemToDelete.id,
        code_barre: itemToDelete.code_barre,
        num_inventaire: itemToDelete.num_inventaire,
        old_num_inventaire: itemToDelete.old_num_inventaire,
        departement: itemToDelete.departement,
        num_bureau: itemToDelete.num_bureau,
        beneficiaire: itemToDelete.beneficiaire,
        designation: itemToDelete.designation,
        quantite: itemToDelete.quantite,
        num_serie: itemToDelete.num_serie,
        condition: itemToDelete.condition,
        description: itemToDelete.description,
        prix: itemToDelete.prix,
        categorie: itemToDelete.categorie,
        chemin_image: itemToDelete.chemin_image,
        date_ajouter: itemToDelete.date_ajouter,
        date_modification: itemToDelete.date_modification,
      });

      // Now delete from main table
      const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      return false;
    }
  }

  async bulkDeleteInventoryItems(itemIds: number[]): Promise<number> {
    try {
      let deletedCount = 0;
      
      for (const id of itemIds) {
        const success = await this.deleteInventoryItem(id);
        if (success) {
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error("Error bulk deleting items:", error);
      throw error;
    }
  }

  async bulkUpdateInventoryItems(itemIds: number[], data: Partial<InventoryItem>): Promise<number> {
    try {
      // Clean the data object to only include valid fields and remove undefined values
      const cleanData: any = {};
      
      const validFields = ['departement', 'categorie', 'condition', 'num_bureau', 'beneficiaire', 'description', 'prix'];
      
      for (const field of validFields) {
        if (data[field as keyof InventoryItem] !== undefined && data[field as keyof InventoryItem] !== null) {
          cleanData[field] = data[field as keyof InventoryItem];
        }
      }

      if (Object.keys(cleanData).length === 0) {
        return 0;
      }

      // Add update timestamp
      cleanData.date_modification = new Date();

      await db
        .update(inventoryItems)
        .set(cleanData)
        .where(inArray(inventoryItems.id, itemIds));

      return itemIds.length;
    } catch (error) {
      console.error("Error bulk updating inventory items:", error);
      throw error;
    }
  }

  async getInventoryStats(): Promise<{
    totalItems: number;
    availableItems: number;
    unavailableItems: number;
    totalValue: number;
  }> {
    const [stats] = await db
      .select({
        totalItems: sql<number>`count(*)`,
        availableItems: sql<number>`count(*) filter (where ${inventoryItems.quantite} > 0)`,
        unavailableItems: sql<number>`count(*) filter (where ${inventoryItems.quantite} = 0)`,
        totalValue: sql<number>`sum(${inventoryItems.prix}::numeric * ${inventoryItems.quantite})`,
      })
      .from(inventoryItems);

    return {
      totalItems: Number(stats.totalItems),
      availableItems: Number(stats.availableItems),
      unavailableItems: Number(stats.unavailableItems),
      totalValue: Number(stats.totalValue || 0),
    };
  }

  async getDepartments(): Promise<string[]> {
    const result = await db
      .selectDistinct({ departement: inventoryItems.departement })
      .from(inventoryItems)
      .orderBy(asc(inventoryItems.departement));
    
    return result.map(r => r.departement).filter(d => d && d.trim() !== '');
  }

  async getCategories(): Promise<string[]> {
    const result = await db
      .selectDistinct({ categorie: inventoryItems.categorie })
      .from(inventoryItems)
      .orderBy(asc(inventoryItems.categorie));
    
    return result.map(r => r.categorie).filter(c => c && c.trim() !== '');
  }

  async getConditions(): Promise<string[]> {
    const result = await db
      .selectDistinct({ condition: inventoryItems.condition })
      .from(inventoryItems)
      .orderBy(asc(inventoryItems.condition));
    
    return result.map(r => r.condition).filter(c => c && c.trim() !== '');
  }

  // Search results methods
  async addSearchResult(result: InsertSearchResult): Promise<SearchResult> {
    // Check if barcode already exists
    const existing = await db
      .select()
      .from(searchResults)
      .where(eq(searchResults.code_barre, result.code_barre))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record with incremented scan count
      const [updatedResult] = await db
        .update(searchResults)
        .set({ 
          scan_count: existing[0].scan_count + 1,
          last_scan_date: new Date(),
          found: result.found,
          designation: result.designation || existing[0].designation
        })
        .where(eq(searchResults.id, existing[0].id))
        .returning();
      return updatedResult;
    } else {
      // Insert new record
      const [searchResult] = await db
        .insert(searchResults)
        .values(result)
        .returning();
      return searchResult;
    }
  }

  async getSearchResults(): Promise<SearchResult[]> {
    return await db
      .select()
      .from(searchResults)
      .orderBy(desc(searchResults.date_recherche));
  }

  async deleteSearchResult(id: number): Promise<boolean> {
    const result = await db
      .delete(searchResults)
      .where(eq(searchResults.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearSearchResults(): Promise<void> {
    await db.delete(searchResults);
  }

  async getDeletedItems(): Promise<DeletedItem[]> {
    try {
      const results = await db
        .select()
        .from(deletedItems)
        .orderBy(desc(deletedItems.date_suppression));
      return results;
    } catch (error) {
      console.error("Error fetching deleted items:", error);
      return [];
    }
  }

  async restoreDeletedItem(deletedItemId: number): Promise<InventoryItem | undefined> {
    try {
      // Get the deleted item
      const deletedItem = await db
        .select()
        .from(deletedItems)
        .where(eq(deletedItems.id, deletedItemId))
        .limit(1);

      if (deletedItem.length === 0) {
        return undefined;
      }

      const item = deletedItem[0];

      // Restore to main inventory table
      const restoredItem = await db.insert(inventoryItems).values({
        code_barre: item.code_barre,
        num_inventaire: item.num_inventaire,
        old_num_inventaire: item.old_num_inventaire,
        departement: item.departement,
        num_bureau: item.num_bureau,
        beneficiaire: item.beneficiaire,
        designation: item.designation,
        quantite: item.quantite,
        num_serie: item.num_serie,
        condition: item.condition,
        description: item.description,
        prix: item.prix,
        categorie: item.categorie,
        chemin_image: item.chemin_image,
        date_ajouter: item.date_ajouter,
        date_modification: new Date(), // Update modification date
      }).returning();

      // Remove from deleted items table
      await db.delete(deletedItems).where(eq(deletedItems.id, deletedItemId));

      return restoredItem[0];
    } catch (error) {
      console.error("Error restoring deleted item:", error);
      return undefined;
    }
  }

  async permanentlyDeleteItem(deletedItemId: number): Promise<boolean> {
    try {
      const result = await db.delete(deletedItems).where(eq(deletedItems.id, deletedItemId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      return false;
    }
  }

  async bulkRestoreDeletedItems(deletedItemIds: number[]): Promise<number> {
    try {
      let restoredCount = 0;
      
      for (const id of deletedItemIds) {
        const restoredItem = await this.restoreDeletedItem(id);
        if (restoredItem) {
          restoredCount++;
        }
      }
      
      return restoredCount;
    } catch (error) {
      console.error("Error bulk restoring deleted items:", error);
      throw error;
    }
  }

  async bulkPermanentlyDeleteItems(deletedItemIds: number[]): Promise<number> {
    try {
      let deletedCount = 0;
      
      for (const id of deletedItemIds) {
        const success = await this.permanentlyDeleteItem(id);
        if (success) {
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error("Error bulk permanently deleting items:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
