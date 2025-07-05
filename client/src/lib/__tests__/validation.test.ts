import { 
  enhancedInventoryItemSchema,
  enhancedSearchFiltersSchema,
  bulkEditSchema,
  validateFile,
  validateBarcode,
  validateInventoryNumber
} from '../validation';

describe('Validation Utils', () => {
  describe('enhancedInventoryItemSchema', () => {
    const validItem = {
      code_barre: '123456789',
      designation: 'Test Item',
      departement: 'IT',
      categorie: 'Hardware',
      condition: 'Bon',
      beneficiaire: 'John Doe',
      num_bureau: 'B101',
      num_inventaire: 'INV001',
      old_num_inventaire: null,
      num_serie: 'SN123',
      quantite: 1,
      prix: 100.50,
      description: 'Test description',
      chemin_image: null
    };

    it('should validate correct inventory item', () => {
      const result = enhancedInventoryItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject empty code_barre', () => {
      const item = { ...validItem, code_barre: '' };
      const result = enhancedInventoryItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le code-barres est obligatoire');
      }
    });

    it('should reject invalid code_barre characters', () => {
      const item = { ...validItem, code_barre: 'invalid@code!' };
      const result = enhancedInventoryItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ne peut contenir que des lettres');
      }
    });

    it('should reject negative price', () => {
      const item = { ...validItem, prix: -10 };
      const result = enhancedInventoryItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le prix ne peut pas être négatif');
      }
    });

    it('should reject negative quantity', () => {
      const item = { ...validItem, quantite: -1 };
      const result = enhancedInventoryItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La quantité ne peut pas être négative');
      }
    });
  });

  describe('enhancedSearchFiltersSchema', () => {
    it('should validate correct search filters', () => {
      const filters = {
        search: 'test',
        department: 'IT',
        minPrice: 0,
        maxPrice: 100
      };
      const result = enhancedSearchFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should reject when minPrice > maxPrice', () => {
      const filters = {
        minPrice: 100,
        maxPrice: 50
      };
      const result = enhancedSearchFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le prix minimum ne peut pas être supérieur au prix maximum');
      }
    });

    it('should reject when startDate > endDate', () => {
      const filters = {
        startDate: new Date('2023-12-31'),
        endDate: new Date('2023-01-01')
      };
      const result = enhancedSearchFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La date de début ne peut pas être postérieure à la date de fin');
      }
    });
  });

  describe('validateFile', () => {
    it('should validate correct Excel file', () => {
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateFile(file, 'excel');
      expect(result.valid).toBe(true);
    });

    it('should reject oversized file', () => {
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // 20MB
      
      const result = validateFile(file, 'excel');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop volumineux');
    });

    it('should reject wrong file type', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = validateFile(file, 'excel');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Format de fichier non supporté');
    });
  });

  describe('validateBarcode', () => {
    it('should validate correct barcode', () => {
      const result = validateBarcode('ABC123456');
      expect(result.valid).toBe(true);
    });

    it('should reject empty barcode', () => {
      const result = validateBarcode('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le code-barres ne peut pas être vide');
    });

    it('should reject short barcode', () => {
      const result = validateBarcode('AB');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le code-barres doit contenir au moins 3 caractères');
    });

    it('should reject long barcode', () => {
      const longBarcode = 'A'.repeat(51);
      const result = validateBarcode(longBarcode);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le code-barres ne peut pas dépasser 50 caractères');
    });

    it('should reject invalid characters', () => {
      const result = validateBarcode('ABC@123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ne peut contenir que des lettres');
    });
  });

  describe('validateInventoryNumber', () => {
    it('should validate correct inventory number', () => {
      const result = validateInventoryNumber('INV-123/A');
      expect(result.valid).toBe(true);
    });

    it('should reject empty inventory number', () => {
      const result = validateInventoryNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le numéro d\'inventaire ne peut pas être vide');
    });

    it('should reject long inventory number', () => {
      const longNumber = 'A'.repeat(51);
      const result = validateInventoryNumber(longNumber);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le numéro d\'inventaire ne peut pas dépasser 50 caractères');
    });

    it('should reject invalid characters', () => {
      const result = validateInventoryNumber('INV@123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('caractères invalides');
    });
  });
});