import { exportToExcel, parseExcelFile } from '../excel-utils';
import { InventoryItem } from '@shared/schema';
import * as XLSX from 'xlsx';

// Mock XLSX
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: jest.fn(),
    sheet_to_json: jest.fn(),
  },
  writeFile: jest.fn(),
  read: jest.fn(),
}));

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

describe('Excel Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should export inventory items to Excel format', () => {
      const items = [mockInventoryItem];
      const filename = 'test-export';

      exportToExcel(items, filename);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Code-barres': '123456789',
            'Désignation': 'Test Item',
            'Département': 'IT',
          })
        ])
      );
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle empty items array', () => {
      expect(() => exportToExcel([], 'empty')).not.toThrow();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
    });

    it('should format dates correctly', () => {
      const items = [mockInventoryItem];
      exportToExcel(items, 'date-test');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Date ajoutée': expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/)
          })
        ])
      );
    });

    it('should handle null values gracefully', () => {
      const itemWithNulls: InventoryItem = {
        ...mockInventoryItem,
        old_num_inventaire: null,
        num_serie: null,
        description: null
      };

      expect(() => exportToExcel([itemWithNulls], 'nulls')).not.toThrow();
    });
  });

  describe('parseExcelFile', () => {
    const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    it('should parse valid Excel file', async () => {
      const mockData = [{
        'Code-barres': '123456789',
        'Désignation': 'Test Item',
        'Département': 'IT',
        'Catégorie': 'Hardware',
        'Condition': 'Bon',
        'Bénéficiaire': 'John Doe',
        'Bureau': 'B101',
        'Numéro inventaire': 'INV001',
        'Quantité': 1,
        'Prix': 100.50
      }];

      (XLSX.read as jest.Mock).mockReturnValue({
        Sheets: { 'Sheet1': {} },
        SheetNames: ['Sheet1']
      });
      
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockData);

      const result = await parseExcelFile(mockFile);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        code_barre: '123456789',
        designation: 'Test Item',
        departement: 'IT'
      });
    });

    it('should throw error for invalid file format', async () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      
      await expect(parseExcelFile(invalidFile)).rejects.toThrow('Format de fichier non supporté');
    });

    it('should handle missing required columns', async () => {
      const incompleteData = [{ 'Code-barres': '123' }]; // Missing required fields

      (XLSX.read as jest.Mock).mockReturnValue({
        Sheets: { 'Sheet1': {} },
        SheetNames: ['Sheet1']
      });
      
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(incompleteData);

      await expect(parseExcelFile(mockFile)).rejects.toThrow('données manquantes');
    });

    it('should validate data types', async () => {
      const invalidData = [{
        'Code-barres': '123456789',
        'Désignation': 'Test Item',
        'Département': 'IT',
        'Catégorie': 'Hardware',
        'Condition': 'Bon',
        'Bénéficiaire': 'John Doe',
        'Bureau': 'B101',
        'Numéro inventaire': 'INV001',
        'Quantité': 'invalid', // Should be number
        'Prix': 'invalid' // Should be number
      }];

      (XLSX.read as jest.Mock).mockReturnValue({
        Sheets: { 'Sheet1': {} },
        SheetNames: ['Sheet1']
      });
      
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(invalidData);

      await expect(parseExcelFile(mockFile)).rejects.toThrow('données invalides');
    });
  });
});