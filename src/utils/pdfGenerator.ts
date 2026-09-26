import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Certificate } from '../types';

/**
 * Sanitizes strings for safe cross-platform file names
 */
export const sanitizeFilename = (str: string): string => {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_');
};

/**
 * Generates an official, high-resolution vector PDF certificate for a participant
 */
export const generateCertificatePdf = (cert: Certificate): jsPDF => {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const centerX = pageWidth / 2;

  // Background subtle cream wash
  doc.setFillColor(254, 254, 252);
  doc.rect(0, 0, pageWidth, 210, 'F');

  // Outer primary border (Deep Indigo)
  doc.setDrawColor(30, 27, 75);
  doc.setLineWidth(1.8);
  doc.rect(8, 8, 281, 194);

  // Inner double border (Gold / Amber)
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, 273, 186);
  doc.rect(13.8, 13.8, 269.4, 182.4);

  // Corner Ornaments / Corner Brackets
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(1.2);
  // Top-left
  doc.line(16, 16, 28, 16);
  doc.line(16, 16, 16, 28);
  // Top-right
  doc.line(281, 16, 269, 16);
  doc.line(281, 16, 281, 28);
  // Bottom-left
  doc.line(16, 194, 28, 194);
  doc.line(16, 194, 16, 182);
  // Bottom-right
  doc.line(281, 194, 269, 194);
  doc.line(281, 194, 281, 182);

  // Top Rosette Badge Circle
  doc.setFillColor(79, 70, 229);
  doc.circle(centerX, 28, 6, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, 28, 3, 'F');

  // Organization Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('SYNAPSE × WIDS CERTIFICATION SECRETARIAT', centerX, 40, { align: 'center' });

  // Main Certificate Title
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(30, 27, 75);
  doc.text('CERTIFICATE OF COMPLETION', centerX, 52, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  doc.text('THIS IS PROUDLY PRESENTED TO', centerX, 62, { align: 'center' });

  // Recipient Name (Prominent & Elegant)
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.participantName, centerX, 78, { align: 'center' });

  // Gold separator line
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.line(centerX - 60, 83, centerX + 60, 83);

  // Participant Roll No & Student ID
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const metadataText = `ROLL NUMBER: ${cert.participantRollNumber || 'N/A'}    |    STUDENT ID: ${
    cert.participantStudentId || 'N/A'
  }`;
  doc.text(metadataText, centerX, 92, { align: 'center' });

  // Recognition Narrative
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'for successfully completing all attendance verifications and active summit participation in',
    centerX,
    104,
    { align: 'center' }
  );

  // Event Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(67, 56, 202);
  doc.text(cert.eventName || '', centerX, 114, {
    align: 'center',
  });

  // Issue Date & Attendance Confirmation
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  const checkinInfo = cert.checkIn && cert.checkOut ? ` (Verified Check-In: ${cert.checkIn} • Check-Out: ${cert.checkOut})` : '';
  doc.text(
    `Issued on ${cert.issueDate || 'September 24, 2026'}${checkinInfo}`,
    centerX,
    122,
    { align: 'center' }
  );

  // Divider above footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(25, 142, 272, 142);

  // Footer Left: Credential ID & Verifiable link
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 27, 75);
  doc.text('CREDENTIAL ID:', 25, 153);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(cert.certificateId, 25, 159);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tamper-proof online verification:', 25, 166);
  doc.setTextColor(67, 56, 202);
  doc.text(`https://certificateflow.edu/verify/${cert.certificateId}`, 25, 170);

  // Footer Center: Official Seal
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1);
  doc.circle(centerX, 163, 13, 'FD');

  doc.setDrawColor(180, 83, 9);
  doc.circle(centerX, 163, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text('OFFICIAL SEAL', centerX, 161.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('AUTHENTIC & VERIFIED', centerX, 165.5, { align: 'center' });

  // Footer Right: Signatures
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(30, 27, 75);
  doc.text('Dr. Alex Vance', 248, 158, { align: 'center' });

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(220, 163, 276, 163);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DR. ALEX VANCE', 248, 168, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Director of Academic Certification', 248, 172, { align: 'center' });

  return doc;
};

/**
 * Downloads a single certificate as a PDF file
 */
export const downloadSingleCertificatePdf = (cert: Certificate): void => {
  const doc = generateCertificatePdf(cert);
  const participantPart = sanitizeFilename(cert.participantName) || 'Participant';
  const idPart = sanitizeFilename(cert.participantRollNumber || cert.participantStudentId || cert.certificateId);
  const fileName = `${participantPart}_${idPart}.pdf`;
  doc.save(fileName);
};

/**
 * Generates and bundles multiple certificate PDFs into a single ZIP file
 */
export const downloadCertificatesZip = async (
  certificates: Certificate[],
  onProgress?: (current: number, total: number, currentName: string) => void,
  zipFileName?: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!certificates || certificates.length === 0) {
    return { success: false, count: 0, error: 'No certificates selected for download.' };
  }

  try {
    const zip = new JSZip();
    const folder = zip.folder('Certificates') || zip;
    const total = certificates.length;

    // Process certificates and add each PDF to the archive
    for (let i = 0; i < total; i++) {
      const cert = certificates[i];
      if (onProgress) {
        onProgress(i + 1, total, cert.participantName);
      }

      // Small yield to let React UI repaint progress
      await new Promise((r) => setTimeout(r, 15));

      const doc = generateCertificatePdf(cert);
      const pdfArrayBuffer = doc.output('arraybuffer');

      const participantPart = sanitizeFilename(cert.participantName) || `Participant_${i + 1}`;
      const idPart = sanitizeFilename(cert.participantRollNumber || cert.participantStudentId || cert.certificateId);
      const fileName = `${participantPart}_${idPart}.pdf`;

      folder.file(fileName, pdfArrayBuffer);
    }

    // Generate ZIP archive blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Default ZIP filename
    const dateStr = new Date().toISOString().split('T')[0];
    const finalZipName = zipFileName || `Certificates_Batch_${dateStr}.zip`;

    // Trigger browser download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalZipName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, count: total };
  } catch (err: any) {
    console.error('Failed to generate certificates ZIP:', err);
    return {
      success: false,
      count: 0,
      error: err?.message || 'Failed to compile ZIP archive.',
    };
  }
};
