import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, updateInventoryItemSchema, searchFiltersSchema, type SearchFilters } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";
import { 
  generalRateLimit, 
  apiRateLimit, 
  uploadRateLimit, 
  uploadConfig, 
  handleMulterError, 
  securityHeaders,
  validateRequest 
} from './middleware/security';
import { auditMiddleware, logAuditMiddleware, setAuditContext } from './middleware/audit';
import { backupService } from './services/backup';

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global security middleware
  app.use(securityHeaders);
  app.use(generalRateLimit);
  app.use(validateRequest);
  app.use(logAuditMiddleware);

  // Start automatic backups (only in development)
  if (process.env.NODE_ENV !== 'production') {
    backupService.scheduleAutomaticBackups();
  }

  // Health check endpoint for deployment monitoring
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime()
    });
  });

  // Get all inventory items with filtering, pagination, and sorting
  app.get("/api/inventory", apiRateLimit, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const sortBy = (req.query.sortBy as string) || 'date_ajouter';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      
      let filters: SearchFilters | undefined;
      if (req.query.filters) {
        const filtersData = typeof req.query.filters === 'string' 
          ? JSON.parse(req.query.filters) 
          : req.query.filters;
        filters = searchFiltersSchema.parse(filtersData);
      }

      const result = await storage.getAllInventoryItems(filters, page, limit, sortBy, sortOrder);
      res.json(result);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Get single inventory item
  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  // Get inventory item by barcode
  app.get("/api/inventory/barcode/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      const item = await storage.getInventoryItemByBarcode(barcode);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found", available: false });
      }
      
      res.json({ ...item, available: item.quantite > 0 });
    } catch (error) {
      console.error("Error fetching inventory item by barcode:", error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  // Create new inventory item
  app.post("/api/inventory", async (req, res) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Update inventory item
  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = updateInventoryItemSchema.parse(req.body);
      const item = await storage.updateInventoryItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Delete inventory item
  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Bulk delete inventory items
  app.post("/api/inventory/bulk-delete", async (req, res) => {
    try {
      const { itemIds } = req.body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ message: "Invalid item IDs array" });
      }

      const deletedCount = await storage.bulkDeleteInventoryItems(itemIds);
      
      res.json({ 
        message: `${deletedCount} items deleted successfully`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error bulk deleting inventory items:", error);
      res.status(500).json({ message: "Failed to bulk delete inventory items" });
    }
  });

  // Get inventory statistics
  app.get("/api/inventory-stats", async (req, res) => {
    try {
      const stats = await storage.getInventoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      res.status(500).json({ message: "Failed to fetch inventory stats" });
    }
  });

  // Get filter options
  app.get("/api/filter-options", async (req, res) => {
    try {
      const [departments, categories, conditions] = await Promise.all([
        storage.getDepartments(),
        storage.getCategories(),
        storage.getConditions(),
      ]);
      
      res.json({
        departments,
        categories,
        conditions,
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  // Export inventory to Excel
  app.get("/api/inventory/export/excel", async (req, res) => {
    try {
      const { items } = await storage.getAllInventoryItems(undefined, 1, 10000);
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(items.map(item => ({
        "Code-barres": item.code_barre,
        "N° Inventaire": item.num_inventaire,
        "Ancien N° Inventaire": item.old_num_inventaire,
        "Département": item.departement,
        "N° Bureau": item.num_bureau,
        "Bénéficiaire": item.beneficiaire,
        "Désignation": item.designation,
        "Quantité": item.quantite,
        "N° Série": item.num_serie,
        "Condition": item.condition,
        "Description": item.description,
        "Prix (DA)": item.prix,
        "Catégorie": item.categorie,
        "Date Ajout": item.date_ajouter,
        "Date Modification": item.date_modification,
      })));

      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="inventaire_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Failed to export to Excel" });
    }
  });

  // Import inventory from Excel with security
  app.post("/api/inventory/import/excel", 
    uploadRateLimit,
    uploadConfig.single('file'),
    handleMulterError,
    auditMiddleware('IMPORT', 'inventory_items'),
    async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        errors: [] as string[],
      };

      for (const [index, row] of data.entries()) {
        try {
          const rowData = row as any;
          const itemData = {
            code_barre: rowData["Code-barres"] || rowData["code_barre"],
            num_inventaire: rowData["N° Inventaire"] || rowData["num_inventaire"],
            old_num_inventaire: rowData["Ancien N° Inventaire"] || rowData["old_num_inventaire"],
            departement: rowData["Département"] || rowData["departement"],
            num_bureau: rowData["N° Bureau"] || rowData["num_bureau"],
            beneficiaire: rowData["Bénéficiaire"] || rowData["beneficiaire"],
            designation: rowData["Désignation"] || rowData["designation"],
            quantite: parseInt(rowData["Quantité"] || rowData["quantite"]) || 1,
            num_serie: rowData["N° Série"] || rowData["num_serie"],
            condition: rowData["Condition"] || rowData["condition"],
            description: rowData["Description"] || rowData["description"],
            prix: parseFloat(rowData["Prix (DA)"] || rowData["prix"]) || 0,
            categorie: rowData["Catégorie"] || rowData["categorie"],
          };

          const validatedData = insertInventoryItemSchema.parse(itemData);
          await storage.createInventoryItem(validatedData);
          results.success++;
        } catch (error) {
          results.errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Set audit context for import operation
      setAuditContext(req as any, {
        description: `Excel import: ${results.success} items imported, ${results.errors.length} errors`
      });

      res.json(results);
    } catch (error) {
      console.error("Error importing from Excel:", error);
      res.status(500).json({ message: "Failed to import from Excel" });
    }
  });

  // Backup management endpoints
  app.post("/api/backup/create", apiRateLimit, auditMiddleware('BACKUP', 'database'), async (req, res) => {
    try {
      const result = await backupService.createBackup();
      if (result.success) {
        setAuditContext(req as any, {
          description: `Manual backup created: ${result.filename}`
        });
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Backup creation failed:", error);
      res.status(500).json({ success: false, error: "Backup creation failed" });
    }
  });

  app.get("/api/backup/list", apiRateLimit, async (req, res) => {
    try {
      const backups = await backupService.listBackups();
      res.json(backups);
    } catch (error) {
      console.error("Failed to list backups:", error);
      res.status(500).json({ message: "Failed to list backups" });
    }
  });

  app.post("/api/backup/restore/:filename", apiRateLimit, auditMiddleware('RESTORE', 'database'), async (req, res) => {
    try {
      const { filename } = req.params;
      const result = await backupService.restoreBackup(filename);
      if (result.success) {
        setAuditContext(req as any, {
          description: `Database restored from backup: ${filename}`
        });
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Backup restore failed:", error);
      res.status(500).json({ success: false, error: "Backup restore failed" });
    }
  });

  // Get deleted items
  app.get("/api/deleted-items", async (req, res) => {
    try {
      const deletedItems = await storage.getDeletedItems();
      res.json(deletedItems);
    } catch (error) {
      console.error("Error fetching deleted items:", error);
      res.status(500).json({ message: "Failed to fetch deleted items" });
    }
  });

  // Restore deleted item
  app.post("/api/deleted-items/:id/restore", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deleted item ID" });
      }

      const restoredItem = await storage.restoreDeletedItem(id);
      if (!restoredItem) {
        return res.status(404).json({ message: "Deleted item not found" });
      }

      res.json(restoredItem);
    } catch (error) {
      console.error("Error restoring deleted item:", error);
      res.status(500).json({ message: "Failed to restore item" });
    }
  });

  // Permanently delete item
  app.delete("/api/deleted-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deleted item ID" });
      }

      const success = await storage.permanentlyDeleteItem(id);
      if (!success) {
        return res.status(404).json({ message: "Deleted item not found" });
      }

      res.json({ message: "Item permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      res.status(500).json({ message: "Failed to permanently delete item" });
    }
  });

  // Bulk restore deleted items
  app.post("/api/deleted-items/bulk-restore", async (req, res) => {
    try {
      const { itemIds } = req.body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ message: "Invalid item IDs array" });
      }

      const restoredCount = await storage.bulkRestoreDeletedItems(itemIds);
      
      res.json({ 
        message: `${restoredCount} items restored successfully`,
        restoredCount 
      });
    } catch (error) {
      console.error("Error bulk restoring deleted items:", error);
      res.status(500).json({ message: "Failed to bulk restore deleted items" });
    }
  });

  // Bulk permanently delete items
  app.post("/api/deleted-items/bulk-permanent-delete", async (req, res) => {
    try {
      const { itemIds } = req.body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ message: "Invalid item IDs array" });
      }

      const deletedCount = await storage.bulkPermanentlyDeleteItems(itemIds);
      
      res.json({ 
        message: `${deletedCount} items permanently deleted`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error bulk permanently deleting items:", error);
      res.status(500).json({ message: "Failed to bulk permanently delete items" });
    }
  });

  // Bulk edit inventory items
  app.post("/api/inventory/bulk-edit", async (req, res) => {
    try {
      const { data, itemIds } = req.body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "itemIds array is required" });
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: "data object is required" });
      }

      const updatedCount = await storage.bulkUpdateInventoryItems(itemIds, data);
      res.json({ updatedCount });
    } catch (error) {
      console.error("Error bulk editing inventory items:", error);
      res.status(500).json({ error: "Failed to edit inventory items" });
    }
  });

  // Search results routes
  app.get("/api/search-results", async (req, res) => {
    try {
      const results = await storage.getSearchResults();
      res.json(results);
    } catch (error) {
      console.error("Error fetching search results:", error);
      res.status(500).json({ message: "Failed to fetch search results" });
    }
  });

  app.post("/api/search-results", async (req, res) => {
    try {
      const result = await storage.addSearchResult(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding search result:", error);
      res.status(500).json({ message: "Failed to add search result" });
    }
  });

  app.delete("/api/search-results/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSearchResult(id);
      if (success) {
        res.json({ message: "Search result deleted successfully" });
      } else {
        res.status(404).json({ message: "Search result not found" });
      }
    } catch (error) {
      console.error("Error deleting search result:", error);
      res.status(500).json({ message: "Failed to delete search result" });
    }
  });

  app.delete("/api/search-results", async (req, res) => {
    try {
      await storage.clearSearchResults();
      res.json({ message: "All search results cleared successfully" });
    } catch (error) {
      console.error("Error clearing search results:", error);
      res.status(500).json({ message: "Failed to clear search results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
