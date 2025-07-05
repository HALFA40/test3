import jsPDF from 'jspdf';
import type { InventoryItem } from '@shared/schema';

export async function generateItemPDF(item: InventoryItem) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE DE BUREAU', 20, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 150, 20);
  doc.text(`Bureau: ${item.num_bureau}`, 150, 28);
  doc.text(`Bénéficiaire: ${item.beneficiaire}`, 150, 36);
  
  // Table header
  let yPos = 60;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails de l\'article:', 20, yPos);
  
  yPos += 15;
  
  // Table structure with specific columns: Code-barre, N° Inv., Bureau, Désignation, Qté
  const colWidths = [35, 35, 25, 70, 20];
  const headers = ['Code-barre', 'N° Inv.', 'Bureau', 'Désignation', 'Qté'];
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  
  let xPos = 20;
  headers.forEach((header, index) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[index];
  });
  
  // Draw header line
  doc.line(20, yPos + 2, 185, yPos + 2);
  yPos += 10;
  
  // Table content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  xPos = 20;
  const values = [
    item.code_barre,
    item.num_inventaire,
    item.num_bureau,
    item.designation,
    item.quantite.toString()
  ];
  
  values.forEach((value, index) => {
    // Truncate long text to fit column width
    let displayValue = String(value);
    if (index === 3 && displayValue.length > 25) { // Désignation column
      displayValue = displayValue.substring(0, 22) + '...';
    }
    doc.text(displayValue, xPos, yPos);
    xPos += colWidths[index];
  });
  
  // Draw content line
  doc.line(20, yPos + 2, 185, yPos + 2);
  
  yPos += 20;
  
  // Additional information section
  if (item.description) {
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    
    // Handle long descriptions
    const description = item.description;
    const maxWidth = 170;
    const lines = doc.splitTextToSize(description, maxWidth);
    
    lines.forEach((line: string) => {
      doc.text(line, 20, yPos);
      yPos += 6;
    });
    yPos += 10;
  }
  
  // Footer
  yPos = Math.max(yPos + 20, 250);
  doc.setFontSize(10);
  doc.text('Date d\'ajout: ' + new Date(item.date_ajouter).toLocaleDateString('fr-FR'), 20, yPos);
  doc.text('Dernière modification: ' + new Date(item.date_modification).toLocaleDateString('fr-FR'), 20, yPos + 5);
  
  // Signature area
  yPos += 20;
  doc.line(20, yPos, 80, yPos); // Signature line
  doc.text('Signature responsable', 20, yPos + 5);
  
  doc.line(110, yPos, 170, yPos); // Signature line
  doc.text('Signature bénéficiaire', 110, yPos + 5);
  
  // Download with custom filename format: Fiche_bureau_[Bureau]_[Bénéficiaire]
  const cleanBureau = item.num_bureau.replace(/[^a-zA-Z0-9]/g, '');
  const cleanBeneficiaire = item.beneficiaire.replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`Fiche_bureau_${cleanBureau}_${cleanBeneficiaire}.pdf`);
}

export async function generateMultipleItemsPDF(items: InventoryItem[], title: string = "FICHE DE BUREAU") {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 150, 20);
  doc.text(`Nombre d'articles: ${items.length}`, 150, 28);
  
  // Table header with specific columns: Code-barre, N° Inv., Bureau, Désignation, Qté
  let yPos = 45;
  const colWidths = [35, 25, 25, 80, 20];
  const headers = ['Code-barre', 'N° Inv.', 'Bureau', 'Désignation', 'Qté'];
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  
  let xPos = 20;
  headers.forEach((header, index) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[index];
  });
  
  // Draw header line
  doc.line(20, yPos + 2, 185, yPos + 2);
  yPos += 8;
  
  // Table content
  doc.setFont('helvetica', 'normal');
  
  items.forEach((item) => {
    if (yPos > 270) { // New page if needed
      doc.addPage();
      yPos = 20;
      
      // Repeat header on new page
      doc.setFont('helvetica', 'bold');
      xPos = 20;
      headers.forEach((header, index) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[index];
      });
      doc.line(20, yPos + 2, 185, yPos + 2);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
    }
    
    xPos = 20;
    const values = [
      item.code_barre,
      item.num_inventaire,
      item.num_bureau,
      item.designation,
      item.quantite.toString()
    ];
    
    values.forEach((value, index) => {
      let displayValue = String(value);
      // Truncate long text to fit column width
      if (index === 3 && displayValue.length > 30) { // Désignation column
        displayValue = displayValue.substring(0, 27) + '...';
      }
      doc.text(displayValue, xPos, yPos);
      xPos += colWidths[index];
    });
    
    yPos += 6;
  });
  
  // Footer
  yPos += 20;
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, yPos);
  
  // Download
  doc.save(`fiche_bureau_liste_${new Date().toISOString().split('T')[0]}.pdf`);
}