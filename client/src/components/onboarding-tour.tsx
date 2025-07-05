import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Play, RotateCcw, Package, Plus, FileSpreadsheet, Upload, Smartphone, DollarSign, Search, History, XCircle, CheckCircle, HelpCircle } from "lucide-react";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const tourSteps: Step[] = [
  {
    target: "body",
    content: (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Bienvenue dans le Système d'Inventaire!</h3>
            <p className="text-sm text-muted-foreground">Version 2.0 - Gestion complète d'inventaire</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ce tour guidé vous accompagnera dans la découverte de toutes les fonctionnalités 
          de gestion d'inventaire. Vous apprendrez comment ajouter des articles, 
          utiliser le scanner de codes-barres, générer des exports et bien plus encore.
        </p>
        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <p className="text-xs font-medium mb-1">🎯 Ce que vous allez apprendre :</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ajouter et gérer des articles</li>
            <li>• Utiliser le scanner de codes-barres</li>
            <li>• Exporter et importer des données</li>
            <li>• Analyser les statistiques d'inventaire</li>
            <li>• Utiliser les fonctionnalités mobiles</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Durée estimée : 3-4 minutes • 12 étapes
        </p>
      </div>
    ),
    placement: "center",
  },
  {
    target: '[data-tour="add-button"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold">Ajouter un nouvel article</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Le point de départ pour enrichir votre inventaire. Cliquez sur ce bouton 
          pour ouvrir le formulaire d'ajout d'article.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
            🔍 Champs obligatoires :
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Code-barres (unique)</li>
            <li>• Numéro d'inventaire</li>
            <li>• Désignation</li>
            <li>• Département et bureau</li>
            <li>• Bénéficiaire</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Astuce : Vous pouvez scanner un code-barres directement depuis le formulaire
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="export-button"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold">Exporter en Excel</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Exportez votre inventaire vers un fichier Excel pour l'analyser, 
          le partager ou créer des rapports personnalisés.
        </p>
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
            📊 Formats d'export disponibles :
          </p>
          <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
            <li>• Export complet (tous les articles)</li>
            <li>• Export filtré (selon vos critères)</li>
            <li>• Export de sélection (articles choisis)</li>
            <li>• Export de fiches bureau (PDF)</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Astuce : L'export respecte les filtres actifs dans votre recherche
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="import-button"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold">Importer depuis Excel</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Importez rapidement de nombreux articles depuis un fichier Excel. 
          Le système détecte automatiquement les colonnes et valide les données.
        </p>
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
            ⚠️ Prérequis pour l'import :
          </p>
          <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
            <li>• Fichier .xlsx ou .xls uniquement</li>
            <li>• Taille maximale : 10 MB</li>
            <li>• Codes-barres uniques requis</li>
            <li>• Validation automatique des données</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Astuce : Téléchargez d'abord un export pour voir le format attendu
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="mobile-button"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold">Interface mobile avancée</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Accédez à l'interface mobile optimisée pour le scan sur le terrain 
          avec fonctionnalités hors-ligne et reconnaissance vocale.
        </p>
        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
            📱 Fonctionnalités mobiles :
          </p>
          <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
            <li>• Scan de codes-barres en temps réel</li>
            <li>• Mode hors-ligne avec synchronisation</li>
            <li>• Commandes vocales intégrées</li>
            <li>• Scan par lots (batch scanning)</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Parfait pour les inventaires physiques sur le terrain
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="insights-tab"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold">Tableau de bord - Aperçu rapide</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Consultez en un coup d'œil les métriques clés de votre inventaire : 
          statistiques, répartition par département et analyse des tendances.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
            📈 Indicateurs disponibles :
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Nombre total d'articles</li>
            <li>• Articles disponibles/indisponibles</li>
            <li>• Répartition par département</li>
            <li>• État des équipements</li>
            <li>• Valeur totale de l'inventaire</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Les graphiques se mettent à jour automatiquement
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="inventory-tab"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold">Inventaire complet</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Visualisez et gérez tous vos articles avec des outils avancés : 
          tri, filtrage, sélection multiple et actions en lot.
        </p>
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
            🛠️ Fonctionnalités disponibles :
          </p>
          <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
            <li>• Tri par colonne (clic sur en-tête)</li>
            <li>• Filtrage avancé multi-critères</li>
            <li>• Sélection multiple (Ctrl+clic)</li>
            <li>• Actions en lot (supprimer, modifier)</li>
            <li>• Redimensionnement des colonnes</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Cliquez sur une ligne pour voir les détails complets
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="search-tab"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-orange-600" />
          <h4 className="font-semibold">Recherche et scan avancés</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Utilisez cette section pour scanner des codes-barres et suivre 
          les articles trouvés ou non trouvés. Idéal pour les inventaires physiques.
        </p>
        <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
            🔍 Options de recherche :
          </p>
          <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
            <li>• Recherche textuelle full-text</li>
            <li>• Scan de codes-barres par caméra</li>
            <li>• Saisie manuelle de codes-barres</li>
            <li>• Suivi des articles non trouvés</li>
            <li>• Historique des recherches</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Les résultats "non trouvés" sont automatiquement sauvegardés
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="history-tab"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold">Historique des scans</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Consultez l'historique complet de tous les codes-barres scannés 
          avec statistiques détaillées et possibilité d'export.
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
            📊 Informations trackées :
          </p>
          <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
            <li>• Date et heure de chaque scan</li>
            <li>• Nombre total de scans par article</li>
            <li>• Statut trouvé/non trouvé</li>
            <li>• Département et bureau associés</li>
            <li>• Export Excel de l'historique</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Utilisez les filtres pour analyser les tendances de scan
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="deleted-tab"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <h4 className="font-semibold">Corbeille - Récupération</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Récupérez les articles supprimés par erreur ou confirmez leur suppression définitive. 
          Système de sécurité pour éviter les pertes de données.
        </p>
        <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
            🛡️ Mécanisme de protection :
          </p>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
            <li>• Suppression en deux étapes</li>
            <li>• Restauration en un clic</li>
            <li>• Conservation des données complètes</li>
            <li>• Actions en lot disponibles</li>
            <li>• Audit trail complet</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Les articles supprimés sont conservés jusqu'à suppression définitive
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="filters-section"]',
    content: (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-teal-600" />
          <h4 className="font-semibold">Filtres avancés</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Utilisez les filtres pour affiner votre recherche selon différents critères. 
          Les filtres sont cumulatifs et s'appliquent en temps réel.
        </p>
        <div className="bg-teal-50 dark:bg-teal-950/20 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">
            🎯 Critères de filtrage :
          </p>
          <ul className="text-xs text-teal-600 dark:text-teal-400 space-y-1">
            <li>• Département et bureau</li>
            <li>• Catégorie et condition</li>
            <li>• Plage de prix et dates</li>
            <li>• Codes-barres (opérateurs avancés)</li>
            <li>• Articles disponibles uniquement</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Cliquez sur les badges pour voir les filtres actifs
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: "body",
    content: (
      <div className="p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
            Félicitations ! Tour terminé
          </h3>
          <p className="text-sm text-muted-foreground">
            Vous maîtrisez maintenant toutes les fonctionnalités
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 rounded-lg mb-4">
          <p className="text-sm font-medium mb-2">🎉 Vous êtes maintenant capable de :</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>• Gérer vos articles</div>
            <div>• Utiliser le scanner</div>
            <div>• Analyser les données</div>
            <div>• Exporter/Importer</div>
            <div>• Utiliser les filtres</div>
            <div>• Fonctions mobiles</div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-4">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
            🚀 Prochaines étapes suggérées :
          </p>
          <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>1. Ajoutez votre premier article de test</li>
            <li>2. Essayez le scanner de codes-barres</li>
            <li>3. Explorez les filtres avancés</li>
            <li>4. Testez l'export Excel</li>
            <li>5. Découvrez l'interface mobile</li>
          </ol>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Aide contextuelle</span>
          </div>
          <div>•</div>
          <div className="flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            <span>Relancer le tour</span>
          </div>
        </div>
      </div>
    ),
    placement: "center",
  },
];

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setRun(true);
      setStepIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcuts for tour control
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          setRun(false);
          onClose();
          break;
        case 'ArrowRight':
          if (run && event.ctrlKey) {
            event.preventDefault();
            // Next step - handled by Joyride internally
          }
          break;
        case 'ArrowLeft':
          if (run && event.ctrlKey) {
            event.preventDefault();
            // Previous step - handled by Joyride internally
          }
          break;
        case 'r':
          if (event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            restartTour();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, run, onClose]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      onClose();
    }

    if (action === "close") {
      setRun(false);
      onClose();
    }

    setStepIndex(index);
  };

  const restartTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  return (
    <>
      <Joyride
        steps={tourSteps}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableOverlayClose={true}
        hideCloseButton={false}
        disableScrolling={false}
        spotlightClicks={true}
        spotlightPadding={4}
        locale={{
          back: "Précédent",
          close: "Fermer",
          last: "Terminer",
          next: "Suivant",
          skip: "Passer",
        }}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            backgroundColor: "hsl(var(--background))",
            textColor: "hsl(var(--foreground))",
            arrowColor: "hsl(var(--background))",
            overlayColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 1000,
          },
          tooltip: {
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "2px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--background))",
            opacity: 1,
          },
          tooltipContainer: {
            textAlign: "left",
          },
          tooltipContent: {
            padding: "0",
          },
          buttonNext: {
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
          },
          buttonBack: {
            color: "hsl(var(--muted-foreground))",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "transparent",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
          },
          buttonSkip: {
            color: "hsl(var(--muted-foreground))",
            backgroundColor: "transparent",
            border: "none",
            fontSize: "14px",
          },
          spotlight: {
            borderRadius: "8px",
          },
        }}
      />

      {/* Tour Control Panel - Shows when tour is not running */}
      {!run && isOpen && (
        <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-xl border-2 bg-black text-white backdrop-blur-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-bold text-lg text-white">Tour guidé</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-3">
                  Découvrez toutes les fonctionnalités du système d'inventaire 
                  avec notre tour guidé interactif et détaillé.
                </p>
                
                <div className="bg-gray-800/80 p-3 rounded-lg mb-3 border border-gray-700">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white">12 étapes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white">3-4 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-white">Interactif</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-white">Détaillé</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 p-3 rounded-lg mb-4 border border-gray-600">
                  <p className="text-xs font-medium text-white mb-2">
                    🎯 Vous apprendrez à :
                  </p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Ajouter et gérer des articles</li>
                    <li>• Utiliser le scanner de codes-barres</li>
                    <li>• Exporter et importer des données Excel</li>
                    <li>• Analyser les statistiques avec le dashboard</li>
                    <li>• Utiliser les fonctionnalités mobiles</li>
                    <li>• Maîtriser les filtres avancés</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setRun(true)} size="sm" className="flex-1 bg-white text-black hover:bg-gray-200">
                  <Play className="mr-2 h-4 w-4" />
                  Commencer le tour
                </Button>
                <Button variant="outline" onClick={restartTour} size="sm" className="border-gray-600 text-white hover:bg-gray-800">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Redémarrer
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center text-xs text-gray-400">
                  <span>💡 Vous pouvez quitter à tout moment avec Échap</span>
                </div>
                
                <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-600 text-xs">
                  <p className="font-medium mb-2 text-white">⌨️ Raccourcis clavier :</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-300">
                    <div>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs text-white">Échap</kbd> : Quitter</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs text-white">Ctrl+⇧+R</kbd> : Redémarrer</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs text-white">Espace</kbd> : Suivant</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs text-white">← →</kbd> : Navigation</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Helper hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [tourCompletions, setTourCompletions] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding before
    const seen = localStorage.getItem("inventory-onboarding-seen");
    const completions = parseInt(localStorage.getItem("inventory-onboarding-completions") || "0");
    setTourCompletions(completions);
    
    if (!seen) {
      // Show onboarding for new users after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
    // Track tour start
    const startTime = Date.now();
    localStorage.setItem("inventory-onboarding-start-time", startTime.toString());
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("inventory-onboarding-seen", "true");
    
    // Track completion
    const startTime = parseInt(localStorage.getItem("inventory-onboarding-start-time") || "0");
    const completionTime = Date.now() - startTime;
    const newCompletions = tourCompletions + 1;
    
    localStorage.setItem("inventory-onboarding-completions", newCompletions.toString());
    localStorage.setItem("inventory-onboarding-last-completion", Date.now().toString());
    localStorage.setItem("inventory-onboarding-duration", completionTime.toString());
    
    setTourCompletions(newCompletions);
    setHasSeenOnboarding(true);
  };

  return {
    showOnboarding,
    hasSeenOnboarding,
    tourCompletions,
    startOnboarding,
    closeOnboarding,
  };
}