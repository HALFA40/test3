import * as XLSX from 'xlsx';
import type { InventoryItem } from '@shared/schema';

export function exportToExcel(data: any[], filename?: string) {
  const workbook = XLSX.utils.book_new();
  
  // Check if data is inventory items and format accordingly
  let excelData;
  let sheetName = 'Données';
  
  if (data.length > 0 && 'code_barre' in data[0] && 'num_inventaire' in data[0]) {
    // This is inventory data
    sheetName = 'Inventaire';
    excelData = data.map((item: any) => ({
      'Code-barres': item.code_barre,
      'N° Inventaire': item.num_inventaire,
      'Ancien N° Inventaire': item.old_num_inventaire || '',
      'Département': item.departement,
      'N° Bureau': item.num_bureau,
      'Bénéficiaire': item.beneficiaire,
      'Désignation': item.designation,
      'Quantité': item.quantite,
      'N° Série': item.num_serie || '',
      'Condition': item.condition,
      'Description': item.description || '',
      'Prix (DA)': parseFloat(item.prix),
      'Catégorie': item.categorie,
      'Date Ajout': new Date(item.date_ajouter).toLocaleDateString('fr-FR'),
      'Date Modification': new Date(item.date_modification).toLocaleDateString('fr-FR'),
    }));
  } else {
    // This is already formatted data (like scan history)
    excelData = data;
    sheetName = 'Historique';
  }

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths based on content
  const colWidths = Object.keys(excelData[0] || {}).map(() => ({ wch: 15 }));
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Ensure filename has .xlsx extension
  const baseFileName = filename || `export_${new Date().toISOString().split('T')[0]}`;
  const fileName = baseFileName.endsWith('.xlsx') ? baseFileName : `${baseFileName}.xlsx`;
  
  // Write file with explicit Excel format
  XLSX.writeFile(workbook, fileName, {
    bookType: 'xlsx',
    type: 'binary'
  });
}

export function importFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export function downloadExcelTemplate() {
  const templateData = [
    {
      'Code-barres': '1234567890123',
      'N° Inventaire': 'INV-2024-001',
      'Ancien N° Inventaire': '',
      'Département': 'Informatique',
      'N° Bureau': 'B-205',
      'Bénéficiaire': 'Ahmed Benali',
      'Désignation': 'Ordinateur Dell OptiPlex',
      'Quantité': 1,
      'N° Série': 'ABC123XYZ',
      'Condition': 'Excellent',
      'Description': 'Ordinateur de bureau avec écran',
      'Prix (DA)': 85000.00,
      'Catégorie': 'Ordinateurs',
    },
    {
      'Code-barres': '9876543210987',
      'N° Inventaire': 'INV-2024-002',
      'Ancien N° Inventaire': 'OLD-123',
      'Département': 'Comptabilité',
      'N° Bureau': 'C-101',
      'Bénéficiaire': 'Fatima Khelifi',
      'Désignation': 'Imprimante HP LaserJet',
      'Quantité': 1,
      'N° Série': 'XYZ789ABC',
      'Condition': 'Bon',
      'Description': 'Imprimante laser noir et blanc',
      'Prix (DA)': 45000.00,
      'Catégorie': 'Imprimantes',
    }
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // Code-barres
    { wch: 15 }, // N° Inventaire
    { wch: 15 }, // Ancien N° Inventaire
    { wch: 15 }, // Département
    { wch: 10 }, // N° Bureau
    { wch: 20 }, // Bénéficiaire
    { wch: 30 }, // Désignation
    { wch: 8 },  // Quantité
    { wch: 15 }, // N° Série
    { wch: 12 }, // Condition
    { wch: 40 }, // Description
    { wch: 12 }, // Prix
    { wch: 15 }, // Catégorie
  ];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'template_inventaire.xlsx');
}
