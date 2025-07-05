import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { insertInventoryItemSchema, type InsertInventoryItem, type InventoryItem } from "@shared/schema";
import { X, Save } from "lucide-react";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  filterOptions?: {
    departments: string[];
    categories: string[];
    conditions: string[];
  };
  editingItem?: InventoryItem | null;
  initialValues?: Partial<InsertInventoryItem>;
}

export function AddItemModal({ open, onClose, onSuccess, filterOptions, editingItem, initialValues }: AddItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertInventoryItem>({
    resolver: zodResolver(insertInventoryItemSchema),
    defaultValues: editingItem ? {
      code_barre: editingItem.code_barre,
      num_inventaire: editingItem.num_inventaire,
      old_num_inventaire: editingItem.old_num_inventaire || "",
      departement: editingItem.departement,
      num_bureau: editingItem.num_bureau,
      beneficiaire: editingItem.beneficiaire,
      designation: editingItem.designation,
      quantite: editingItem.quantite,
      num_serie: editingItem.num_serie || "",
      condition: editingItem.condition,
      description: editingItem.description || "",
      prix: editingItem.prix,
      categorie: editingItem.categorie,
      chemin_image: editingItem.chemin_image || "",
    } : {
      code_barre: "",
      num_inventaire: "",
      old_num_inventaire: "",
      departement: "",
      num_bureau: "",
      beneficiaire: "",
      designation: "",
      quantite: 1,
      num_serie: "",
      condition: "",
      description: "",
      prix: "0",
      categorie: "",
      chemin_image: "",
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      // Check if we're editing an existing item (id > 0) or creating a new one
      const isEditing = editingItem && editingItem.id > 0;
      const url = isEditing ? `/api/inventory/${editingItem.id}` : "/api/inventory";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'add'} item`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-stats"] });
      onSuccess();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || `Impossible de ${editingItem ? 'modifier' : 'ajouter'} l'article.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertInventoryItem) => {
    setIsSubmitting(true);
    try {
      await createItemMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const generateInventoryNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}-${random}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {editingItem ? "Modifier l'article" : "Ajouter un nouvel article"}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code_barre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code-barres *</FormLabel>
                    <FormControl>
                      <Input placeholder="Code-barres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="num_inventaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Inventaire *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="N° Inventaire" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(generateInventoryNumber())}
                      >
                        Générer
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="old_num_inventaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ancien N° Inventaire</FormLabel>
                  <FormControl>
                    <Input placeholder="Ancien numéro d'inventaire" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Désignation *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Département *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le département" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filterOptions?.departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                        <SelectItem value="Informatique">Informatique</SelectItem>
                        <SelectItem value="Comptabilité">Comptabilité</SelectItem>
                        <SelectItem value="Ressources Humaines">Ressources Humaines</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="num_bureau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Bureau *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: B-205" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="beneficiaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bénéficiaire *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du bénéficiaire" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (DA) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filterOptions?.categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="Ordinateurs">Ordinateurs</SelectItem>
                        <SelectItem value="Mobilier">Mobilier</SelectItem>
                        <SelectItem value="Équipement">Équipement</SelectItem>
                        <SelectItem value="Fournitures">Fournitures</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filterOptions?.conditions.map((cond) => (
                          <SelectItem key={cond} value={cond}>
                            {cond}
                          </SelectItem>
                        ))}
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Bon">Bon</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="Défaillant">Défaillant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="num_serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Série</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de série" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description détaillée de l'article"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Ajout en cours..." : "Ajouter l'article"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
