import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit, Users, AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@shared/schema";

const bulkEditSchema = z.object({
  departement: z.string().optional(),
  categorie: z.string().optional(),
  condition: z.string().optional(),
  num_bureau: z.string().optional(),
  beneficiaire: z.string().optional(),
  description: z.string().optional(),
  prix: z.string().optional(),
});

type BulkEditData = z.infer<typeof bulkEditSchema>;

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  onBulkEdit: (data: Partial<InventoryItem>, itemIds: number[]) => void;
  selectedItems: InventoryItem[];
  filterOptions?: {
    departments: string[];
    categories: string[];
    conditions: string[];
  };
}

export function BulkEditModal({ 
  open, 
  onClose, 
  onBulkEdit, 
  selectedItems,
  filterOptions 
}: BulkEditModalProps) {
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Set<string>>(new Set());

  const form = useForm<BulkEditData>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      departement: "",
      categorie: "",
      condition: "",
      num_bureau: "",
      beneficiaire: "",
      description: "",
      prix: "",
    },
  });

  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    const newFields = new Set(fieldsToUpdate);
    if (checked) {
      newFields.add(fieldName);
    } else {
      newFields.delete(fieldName);
      // Clear the field value when unchecked
      form.setValue(fieldName as keyof BulkEditData, "");
    }
    setFieldsToUpdate(newFields);
  };

  const onSubmit = (data: BulkEditData) => {
    // Only include fields that are checked for update
    const updateData: Partial<InventoryItem> = {};
    
    fieldsToUpdate.forEach(field => {
      const value = data[field as keyof BulkEditData];
      if (value !== undefined && value !== "") {
        if (field === 'prix') {
          updateData[field] = value;
        } else {
          updateData[field as keyof InventoryItem] = value as any;
        }
      }
    });

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const itemIds = selectedItems.map(item => item.id);
    onBulkEdit(updateData, itemIds);
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setFieldsToUpdate(new Set());
    onClose();
  };

  const getFieldPreview = (field: string) => {
    const values = selectedItems.map(item => item[field as keyof InventoryItem]).filter(Boolean);
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 0) return "Aucune valeur";
    if (uniqueValues.length === 1) return `Actuel: ${uniqueValues[0]}`;
    return `${uniqueValues.length} valeurs différentes`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modification en lot
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Articles sélectionnés ({selectedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {selectedItems.slice(0, 10).map(item => (
                <Badge key={item.id} variant="secondary" className="text-xs">
                  {item.num_inventaire}
                </Badge>
              ))}
              {selectedItems.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedItems.length - 10} autres
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Sélectionnez les champs à modifier. Les valeurs seront appliquées à tous les articles sélectionnés.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              
              {/* Department */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('departement')}
                  onCheckedChange={(checked) => handleFieldToggle('departement', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>Département</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('departement')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="departement"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!fieldsToUpdate.has('departement')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un département" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filterOptions?.departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('categorie')}
                  onCheckedChange={(checked) => handleFieldToggle('categorie', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>Catégorie</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('categorie')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="categorie"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!fieldsToUpdate.has('categorie')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filterOptions?.categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('condition')}
                  onCheckedChange={(checked) => handleFieldToggle('condition', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>État</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('condition')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!fieldsToUpdate.has('condition')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un état" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filterOptions?.conditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Office */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('num_bureau')}
                  onCheckedChange={(checked) => handleFieldToggle('num_bureau', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>N° Bureau</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('num_bureau')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="num_bureau"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="ex: B13" 
                            {...field} 
                            disabled={!fieldsToUpdate.has('num_bureau')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Beneficiary */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('beneficiaire')}
                  onCheckedChange={(checked) => handleFieldToggle('beneficiaire', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>Bénéficiaire</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('beneficiaire')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="beneficiaire"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Nom du bénéficiaire" 
                            {...field} 
                            disabled={!fieldsToUpdate.has('beneficiaire')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('prix')}
                  onCheckedChange={(checked) => handleFieldToggle('prix', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>Prix (DA)</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('prix')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="prix"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            disabled={!fieldsToUpdate.has('prix')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={fieldsToUpdate.has('description')}
                  onCheckedChange={(checked) => handleFieldToggle('description', checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <FormLabel>Description</FormLabel>
                    <p className="text-xs text-muted-foreground">{getFieldPreview('description')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Description détaillée..." 
                            rows={3}
                            {...field} 
                            disabled={!fieldsToUpdate.has('description')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

            </div>

            <Separator />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={fieldsToUpdate.size === 0}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Appliquer à {selectedItems.length} articles
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}