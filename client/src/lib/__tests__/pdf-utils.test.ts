import { generatePDF, generateFicheBureau } from '../pdf-utils';
import { InventoryItem } from '@shared/schema';

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    save: jest.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    }
  }));
});

const mockInventoryItem: InventoryItem = {
  id: 1,
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
  chemin_image: null,
  date_ajouter: new Date('2023-01-01')
};

describe('PDF Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('should generate PDF with correct title and data', () => {
      const items = [mockInventoryItem];
      const title = 'Test Inventory Report';

      generatePDF(items, title);

      expect(require('jspdf')).toHaveBeenCalled();
    });

    it('should handle empty items array', () => {
      expect(() => generatePDF([], 'Empty Report')).not.toThrow();
    });

    it('should handle items with null values', () => {
      const itemWithNulls: InventoryItem = {
        ...mockInventoryItem,
        old_num_inventaire: null,
        num_serie: null,
        description: null,
        chemin_image: null
      };

      expect(() => generatePDF([itemWithNulls], 'Test')).not.toThrow();
    });
  });

  describe('generateFicheBureau', () => {
    it('should generate bureau sheet with correct filename format', () => {
      const items = [mockInventoryItem];
      const bureau = 'B101';

      generateFicheBureau(items, bureau);

      expect(require('jspdf')).toHaveBeenCalled();
    });

    it('should filter items by bureau number', () => {
      const items = [
        { ...mockInventoryItem, num_bureau: 'B101' },
        { ...mockInventoryItem, id: 2, num_bureau: 'B102' }
      ];

      expect(() => generateFicheBureau(items, 'B101')).not.toThrow();
    });

    it('should handle special characters in bureau name', () => {
      const items = [mockInventoryItem];
      const bureau = 'B-101/A';

      expect(() => generateFicheBureau(items, bureau)).not.toThrow();
    });

    it('should throw error for invalid bureau parameter', () => {
      const items = [mockInventoryItem];

      expect(() => generateFicheBureau(items, '')).toThrow('Bureau name is required');
      expect(() => generateFicheBureau(items, '   ')).toThrow('Bureau name is required');
    });
  });
});