import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const pdfMoney = (amount: number) =>
  `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function pdfLayout(title: string) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`Drift - ${title}`);
  doc.setAuthor('Drift Car Rental');
  let page = doc.addPage([595.28, 841.89]),
    y = 785;
  const space = (points: number) => {
    y -= points;
  };
  function ensureRoom(points: number) {
    if (y < points) {
      page = doc.addPage([595.28, 841.89]);
      y = 785;
    }
  }
  function line(text: string, size = 11, strong = false) {
    const font = strong ? bold : regular;
    const clean = text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u00a0\u202f]/g, ' ')
      .replace(/[^\x20-\x7e]/g, '-');
    let part = '';
    const draw = () => {
      ensureRoom(70);
      page.drawText(part, {
        x: 48,
        y,
        size,
        font,
        color: rgb(0.11, 0.11, 0.13),
      });
      space(size + 9);
      part = '';
    };
    for (const char of clean) {
      if (font.widthOfTextAtSize(part + char, size) > 499) draw();
      part += char;
    }
    draw();
  }
  const section = (heading: string) => {
    ensureRoom(125);
    space(14);
    line(heading, 15, true);
  };
  async function save() {
    doc.getPages().forEach((p, i) => {
      p.drawLine({
        start: { x: 48, y: 45 },
        end: { x: 547, y: 45 },
        color: rgb(0.87, 0.88, 0.9),
        thickness: 0.5,
      });
      p.drawText(`Drift Car Rental | ${i + 1} / ${doc.getPageCount()}`, {
        x: 48,
        y: 29,
        size: 9,
        font: regular,
      });
    });
    return doc.save();
  }
  return { line, space, section, ensureRoom, save };
}
