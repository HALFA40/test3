import { z } from 'zod';

// Enhanced validation schemas with better error messages
export const enhancedInventoryItemSchema = z.object({
  code_barre: z.string()
    .min(1, "Le code-barres est obligatoire")
    .max(50, "Le code-barres ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-z0-9\-_]+$/, "Le code-barres ne peut contenir que des lettres, chiffres, tirets et underscores"),
  
  designation: z.string()
    .min(1, "La désignation est obligatoire")
    .max(200, "La désignation ne peut pas dépasser 200 caractères")
    .trim(),
  
  departement: z.string()
    .min(1, "Le département est obligatoire")
    .max(50, "Le département ne peut pas dépasser 50 caractères"),
  
  categorie: z.string()
    .min(1, "La catégorie est obligatoire")
    .max(50, "La catégorie ne peut pas dépasser 50 caractères"),
  
  condition: z.string()
    .min(1, "La condition est obligatoire")
    .max(30, "La condition ne peut pas dépasser 30 caractères"),
  
  beneficiaire: z.string()
    .min(1, "Le bénéficiaire est obligatoire")
    .max(100, "Le bénéficiaire ne peut pas dépasser 100 caractères"),
  
  num_bureau: z.string()
    .min(1, "Le numéro de bureau est obligatoire")
    .max(20, "Le numéro de bureau ne peut pas dépasser 20 caractères"),
  
  num_inventaire: z.string()
    .min(1, "Le numéro d'inventaire est obligatoire")
    .max(50, "Le numéro d'inventaire ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-z0-9\-_/]+$/, "Le numéro d'inventaire contient des caractères invalides"),
  
  old_num_inventaire: z.string()
    .max(50, "L'ancien numéro d'inventaire ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  
  num_serie: z.string()
    .max(50, "Le numéro de série ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  
  quantite: z.number()
    .int("La quantité doit être un nombre entier")
    .min(0, "La quantité ne peut pas être négative")
    .max(999999, "La quantité ne peut pas dépasser 999,999"),
  
  prix: z.number()
    .min(0, "Le prix ne peut pas être négatif")
    .max(999999.99, "Le prix ne peut pas dépasser 999,999.99")
    .multipleOf(0.01, "Le prix doit avoir au maximum 2 décimales"),
  
  description: z.string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  
  chemin_image: z.string()
    .max(255, "Le chemin de l'image ne peut pas dépasser 255 caractères")
    .optional()
    .nullable()
});

// Search validation with better error messages
export const enhancedSearchFiltersSchema = z.object({
  search: z.string().max(100, "La recherche ne peut pas dépasser 100 caractères").optional(),
  department: z.string().max(50, "Le département sélectionné est invalide").optional(),
  category: z.string().max(50, "La catégorie sélectionnée est invalide").optional(),
  condition: z.string().max(30, "La condition sélectionnée est invalide").optional(),
  beneficiary: z.string().max(100, "Le bénéficiaire ne peut pas dépasser 100 caractères").optional(),
  office: z.string().max(20, "Le bureau ne peut pas dépasser 20 caractères").optional(),
  barcode: z.string().max(50, "Le code-barres ne peut pas dépasser 50 caractères").optional(),
  barcodeOperator: z.enum(['contains', 'equals', 'starts_with', 'ends_with']).optional(),
  minPrice: z.number().min(0, "Le prix minimum ne peut pas être négatif").optional(),
  maxPrice: z.number().min(0, "Le prix maximum ne peut pas être négatif").optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
}).refine((data) => {
  if (data.minPrice !== undefined && data.maxPrice !== undefined) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "Le prix minimum ne peut pas être supérieur au prix maximum",
  path: ["maxPrice"]
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: "La date de début ne peut pas être postérieure à la date de fin",
  path: ["endDate"]
});

// Bulk edit validation
export const bulkEditSchema = z.object({
  departement: z.string().min(1).max(50).optional(),
  categorie: z.string().min(1).max(50).optional(),
  condition: z.string().min(1).max(30).optional(),
  beneficiaire: z.string().min(1).max(100).optional(),
  num_bureau: z.string().min(1).max(20).optional(),
  prix: z.number().min(0).max(999999.99).multipleOf(0.01).optional(),
  description: z.string().max(500).optional()
});

// File validation
export const fileValidation = {
  excel: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
};

// Validation helper functions
export function validateFile(file: File, type: 'excel' | 'image'): { valid: boolean; error?: string } {
  const config = fileValidation[type];
  
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024);
    return { 
      valid: false, 
      error: `Le fichier est trop volumineux. Taille maximum: ${maxSizeMB}MB` 
    };
  }
  
  if (!config.allowedTypes.includes(file.type)) {
    const allowedExtensions = config.allowedTypes.map(type => {
      switch (type) {
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '.xlsx';
        case 'application/vnd.ms-excel': return '.xls';
        case 'image/jpeg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/gif': return '.gif';
        case 'image/webp': return '.webp';
        default: return type;
      }
    }).join(', ');
    
    return { 
      valid: false, 
      error: `Format de fichier non supporté. Formats acceptés: ${allowedExtensions}` 
    };
  }
  
  return { valid: true };
}

// Barcode validation
export function validateBarcode(barcode: string): { valid: boolean; error?: string } {
  if (!barcode || barcode.trim().length === 0) {
    return { valid: false, error: "Le code-barres ne peut pas être vide" };
  }
  
  if (barcode.length < 3) {
    return { valid: false, error: "Le code-barres doit contenir au moins 3 caractères" };
  }
  
  if (barcode.length > 50) {
    return { valid: false, error: "Le code-barres ne peut pas dépasser 50 caractères" };
  }
  
  if (!/^[A-Za-z0-9\-_]+$/.test(barcode)) {
    return { valid: false, error: "Le code-barres ne peut contenir que des lettres, chiffres, tirets et underscores" };
  }
  
  return { valid: true };
}

// Inventory number validation
export function validateInventoryNumber(number: string): { valid: boolean; error?: string } {
  if (!number || number.trim().length === 0) {
    return { valid: false, error: "Le numéro d'inventaire ne peut pas être vide" };
  }
  
  if (number.length > 50) {
    return { valid: false, error: "Le numéro d'inventaire ne peut pas dépasser 50 caractères" };
  }
  
  if (!/^[A-Za-z0-9\-_/]+$/.test(number)) {
    return { valid: false, error: "Le numéro d'inventaire contient des caractères invalides" };
  }
  
  return { valid: true };
}

export type EnhancedInventoryItem = z.infer<typeof enhancedInventoryItemSchema>;
export type EnhancedSearchFilters = z.infer<typeof enhancedSearchFiltersSchema>;
export type BulkEditData = z.infer<typeof bulkEditSchema>;