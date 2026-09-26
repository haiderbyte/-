import { CardExportConfig, Quote } from '../types';

// Helper to wrap text nicely on canvas with proper Arabic word handling
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function generateQuoteCardBlob(
  quote: Quote,
  config: CardExportConfig
): Promise<Blob | null> {
  // Ensure fonts are fully loaded into the browser before drawing onto the canvas
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Fallback
    }
  }

  const canvas = document.createElement('canvas');
  let width = 1080;
  let height = 1080;

  if (config.aspectRatio === 'story') {
    width = 1080;
    height = 1920; // 9:16 Instagram Story & Mobile Wallpaper
  } else if (config.aspectRatio === 'landscape') {
    width = 1200;
    height = 800; // 3:2 Twitter / Card Presentation
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  // 1. Background Theme & Melancholic Minimalist Aesthetic
  if (config.style === 'dark-ink') {
    // Dark Charcoal / Ink Gradient
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      60,
      width * 0.5,
      height * 0.55,
      width * 0.85
    );
    grad.addColorStop(0, '#212126');
    grad.addColorStop(0.55, '#161619');
    grad.addColorStop(1, '#0D0D0F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle sumi ink wash halo
    const wash = ctx.createRadialGradient(
      width * 0.3,
      height * 0.4,
      10,
      width * 0.3,
      height * 0.4,
      350
    );
    wash.addColorStop(0, 'rgba(139, 58, 58, 0.08)');
    wash.addColorStop(1, 'rgba(139, 58, 58, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    // Fine paper grain & ink specks
    ctx.fillStyle = 'rgba(226, 217, 200, 0.025)';
    for (let i = 0; i < 450; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rr = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.style === 'parchment') {
    // Vintage Shōwa Paper (Aged Sepia)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#F5EDE0');
    grad.addColorStop(0.4, '#ECE2D0');
    grad.addColorStop(1, '#E2D3BC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Aged paper wash & tea-stain halo
    const teaStain = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      100,
      width * 0.5,
      height * 0.5,
      width * 0.7
    );
    teaStain.addColorStop(0, 'rgba(245, 237, 224, 0.3)');
    teaStain.addColorStop(1, 'rgba(120, 85, 55, 0.08)');
    ctx.fillStyle = teaStain;
    ctx.fillRect(0, 0, width, height);

    // Vintage paper fibers and ink specks
    ctx.fillStyle = 'rgba(70, 45, 25, 0.035)';
    for (let i = 0; i < 650; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rr = Math.random() * 2.2;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.style === 'forest-night') {
    // Kanagawa Pine Forest Dusk
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1B2A22');
    grad.addColorStop(0.5, '#14201A');
    grad.addColorStop(1, '#0C1510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle atmospheric mist
    ctx.fillStyle = 'rgba(200, 220, 210, 0.02)';
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rr = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Pure Monochromatic Void
    ctx.fillStyle = '#0B0B0D';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Framing & Hairline Borders
  const margin = width * 0.07;
  const isParchment = config.style === 'parchment';

  ctx.strokeStyle = isParchment
    ? 'rgba(70, 50, 35, 0.22)'
    : 'rgba(226, 217, 200, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Subtle Inner Accent Frame
  ctx.strokeStyle = isParchment
    ? 'rgba(70, 50, 35, 0.08)'
    : 'rgba(226, 217, 200, 0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    margin + 12,
    margin + 12,
    width - (margin + 12) * 2,
    height - (margin + 12) * 2
  );

  // Four Vintage Corner Accents
  const cornerSize = 26;
  ctx.strokeStyle = isParchment
    ? 'rgba(122, 56, 56, 0.65)'
    : 'rgba(196, 104, 104, 0.75)';
  ctx.lineWidth = 2.5;

  // Top Right
  ctx.beginPath();
  ctx.moveTo(margin + cornerSize, margin);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin, margin + cornerSize);
  ctx.stroke();

  // Top Left
  ctx.beginPath();
  ctx.moveTo(width - margin - cornerSize, margin);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin, margin + cornerSize);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(margin + cornerSize, height - margin);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(margin, height - margin - cornerSize);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(width - margin - cornerSize, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.lineTo(width - margin, height - margin - cornerSize);
  ctx.stroke();

  // 3. Header: App & Author Identity
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillStyle = isParchment ? '#635343' : 'rgba(226, 217, 200, 0.65)';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('شذرات أوسامو دازاي · 太宰 治', width / 2, margin + 50);

  // Top hairline divider
  ctx.strokeStyle = isParchment
    ? 'rgba(70, 50, 35, 0.18)'
    : 'rgba(226, 217, 200, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 130, margin + 70);
  ctx.lineTo(width / 2 + 130, margin + 70);
  ctx.stroke();

  // 4. Quotation Mark / Ornaments
  const quoteMarkStyle = config.quoteMarkStyle || 'classic';
  if (quoteMarkStyle === 'classic') {
    ctx.fillStyle = isParchment
      ? 'rgba(122, 56, 56, 0.32)'
      : 'rgba(196, 104, 104, 0.45)';
    ctx.font = 'italic 115px "Cinzel", serif';
    ctx.fillText('“', width / 2, margin + 175);
  } else if (quoteMarkStyle === 'brackets') {
    ctx.fillStyle = isParchment
      ? 'rgba(122, 56, 56, 0.45)'
      : 'rgba(196, 104, 104, 0.55)';
    ctx.font = '40px "Noto Serif JP", serif';
    ctx.fillText('「  断 片  」', width / 2, margin + 140);
  }

  // 5. Main Arabic Quote Body
  let quoteFontSize = 46;
  let lineHeight = 86;
  if (config.fontSize === 'sm') {
    quoteFontSize = 38;
    lineHeight = 72;
  } else if (config.fontSize === 'lg') {
    quoteFontSize = 52;
    lineHeight = 98;
  }

  // Handle longer quotes gracefully so text never spills
  if (quote.textAr.length > 120) {
    quoteFontSize = Math.max(30, quoteFontSize - 8);
    lineHeight = Math.max(58, lineHeight - 14);
  }

  ctx.font = `bold ${quoteFontSize}px "Amiri", "Noto Naskh Arabic", serif`;
  ctx.fillStyle = isParchment ? '#231D18' : '#FAF6EE';

  const maxTextWidth = width - margin * 2 - 120;
  const quoteLines = wrapText(ctx, quote.textAr, maxTextWidth);

  const totalQuoteHeight = quoteLines.length * lineHeight;
  let startY = (height - totalQuoteHeight) / 2 - 25;

  if (config.aspectRatio === 'story') {
    startY = height * 0.32;
  }

  const isRightAlign = config.textAlign === 'right';
  ctx.textAlign = isRightAlign ? 'right' : 'center';
  const textAnchorX = isRightAlign ? width - margin - 70 : width / 2;

  quoteLines.forEach((line, index) => {
    ctx.fillText(line, textAnchorX, startY + index * lineHeight);
  });

  let currentY = startY + quoteLines.length * lineHeight + 40;

  // 6. Japanese Original Excerpt (Original Kanji)
  if (config.showJapanese && quote.textJp) {
    ctx.font = '300 24px "Noto Serif JP", serif';
    ctx.fillStyle = isParchment
      ? 'rgba(75, 58, 45, 0.75)'
      : 'rgba(226, 217, 200, 0.55)';
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    const jpLines = wrapText(ctx, quote.textJp, maxTextWidth * 0.95);
    jpLines.slice(0, 2).forEach((jpLine, i) => {
      ctx.fillText(jpLine, width / 2, currentY + i * 42);
    });
    currentY += Math.min(jpLines.length, 2) * 42 + 25;
  }

  // 7. Reflection Snippet (Optional)
  if (config.showReflection && quote.reflection && config.aspectRatio !== 'landscape') {
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = 'italic 22px "Amiri", serif';
    ctx.fillStyle = isParchment
      ? 'rgba(105, 78, 58, 0.85)'
      : 'rgba(200, 185, 165, 0.78)';
    const refLines = wrapText(
      ctx,
      `« ${quote.reflection} »`,
      maxTextWidth * 0.85
    );
    refLines.slice(0, 2).forEach((rLine, i) => {
      ctx.fillText(rLine, width / 2, currentY + i * 38);
    });
  }

  // 8. Footer: Book Source, Year, and Japanese Hanko Seal
  const footerY = height - margin - 50;

  // Source & Chapter
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.font = '600 27px "Amiri", serif';
  ctx.fillStyle = isParchment ? '#7A3838' : '#C46868';
  ctx.fillText(`— ${quote.source}`, width / 2, footerY - 45);

  ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isParchment ? '#756858' : 'rgba(226, 217, 200, 0.55)';
  ctx.fillText(`${quote.chapter} · ${quote.year}`, width / 2, footerY - 16);

  // 9. Red Hanko Japanese Stamp (太宰治印)
  if (config.showHankoSeal) {
    const stampSize = 64;
    let stampX = width / 2 - stampSize / 2;

    const sealPosition = config.sealPosition || 'center';
    if (sealPosition === 'left') {
      stampX = margin + 35;
    } else if (sealPosition === 'right') {
      stampX = width - margin - 35 - stampSize;
    }

    const stampY = footerY + 8;

    if (stampY + stampSize <= height - margin + 10) {
      // Stamp Outer Border with textured ink pressure
      ctx.strokeStyle = '#992B2B';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(stampX, stampY, stampSize, stampSize);

      // Stamp Text (太宰 治印)
      ctx.fillStyle = '#992B2B';
      ctx.font = 'bold 25px "Noto Serif JP", serif';
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.fillText('太宰', stampX + stampSize / 2, stampY + 27);
      ctx.fillText('治印', stampX + stampSize / 2, stampY + 53);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * Native Device Share helper (mimicking expo-sharing for web & mobile)
 */
export async function shareQuoteCard(
  quote: Quote,
  blob: Blob
): Promise<{ success: boolean; method: 'native-file' | 'native-text' | 'download' }> {
  const fileName = `dazai-${quote.id}.png`;
  const shareTitle = `شذرة أوسامو دازاي: ${quote.source}`;
  const shareText = `« ${quote.textAr} »\n\n— ${quote.source} (${quote.chapter})\nأوسامو دازاي · 太宰治`;

  // 1. Try native file sharing via Web Share API level 2 (mobile browsers, iOS Safari, Android Chrome)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        return { success: true, method: 'native-file' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: true, method: 'native-file' }; // User dismissed dialog
      }
    }

    // 2. Fallback to native text share if file sharing is restricted by OS
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
      });
      return { success: true, method: 'native-text' };
    } catch {
      // Proceed to direct download
    }
  }

  // 3. Fallback: Trigger instant image download
  downloadBlobAsFile(blob, fileName);
  return { success: true, method: 'download' };
}

/**
 * Copy image directly to user's OS clipboard (paste into Twitter, Discord, WhatsApp, Figma, etc.)
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof ClipboardItem !== 'undefined'
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Helper to download Blob as file
 */
export function downloadBlobAsFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
