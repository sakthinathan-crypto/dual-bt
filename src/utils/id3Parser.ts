/**
 * Client-side lightweight ID3 / Audio tag parser for DualSync BT.
 * Reads ID3v2.3/2.4 tags and extracts Title, Artist, Album, and embedded Cover Art (APIC).
 * Works purely in browser memory with ArrayBuffer, zero node-dependencies.
 */

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  duration?: number;
}

export async function parseAudioFile(file: File): Promise<ParsedAudioMetadata> {
  const defaultTitle = cleanFileName(file.name);
  const metadata: ParsedAudioMetadata = {
    title: defaultTitle,
    artist: 'Local Artist',
    album: 'Local Audio',
  };

  try {
    // Read the first 256KB of the file to check for ID3 header
    const slice = file.slice(0, Math.min(file.size, 262144));
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // Check "ID3" identifier
    if (
      view.byteLength > 10 &&
      view.getUint8(0) === 0x49 && // 'I'
      view.getUint8(1) === 0x44 && // 'D'
      view.getUint8(2) === 0x33    // '3'
    ) {
      const version = view.getUint8(3);
      const tagSize = parseSyncsafeInt(view, 6);

      let offset = 10;
      const end = Math.min(buffer.byteLength, 10 + tagSize);

      while (offset + 10 < end) {
        let frameId = '';
        for (let i = 0; i < 4; i++) {
          const charCode = view.getUint8(offset + i);
          if (charCode >= 32 && charCode <= 126) {
            frameId += String.fromCharCode(charCode);
          }
        }

        if (frameId.length < 4 || frameId[0] === '\0') break;

        const frameSize = version === 4
          ? parseSyncsafeInt(view, offset + 4)
          : view.getUint32(offset + 4);

        if (frameSize <= 0 || offset + 10 + frameSize > end) break;

        const frameDataOffset = offset + 10;
        const frameData = new Uint8Array(buffer, frameDataOffset, frameSize);

        if (frameId === 'TIT2') {
          metadata.title = decodeId3Text(frameData) || metadata.title;
        } else if (frameId === 'TPE1') {
          metadata.artist = decodeId3Text(frameData) || metadata.artist;
        } else if (frameId === 'TALB') {
          metadata.album = decodeId3Text(frameData) || metadata.album;
        } else if (frameId === 'APIC' && !metadata.artworkUrl) {
          metadata.artworkUrl = extractApicImage(frameData);
        }

        offset += 10 + frameSize;
      }
    }
  } catch (err) {
    console.warn('ID3 parsing skipped or failed:', err);
  }

  return metadata;
}

function cleanFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_-]/g, ' ').trim() || 'Untitled Audio';
}

function parseSyncsafeInt(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7f) << 21) |
    ((view.getUint8(offset + 1) & 0x7f) << 14) |
    ((view.getUint8(offset + 2) & 0x7f) << 7) |
    (view.getUint8(offset + 3) & 0x7f)
  );
}

function decodeId3Text(bytes: Uint8Array): string {
  if (bytes.length <= 1) return '';
  const encoding = bytes[0];
  const textBytes = bytes.subarray(1);

  try {
    if (encoding === 0) {
      // ISO-8859-1
      return new TextDecoder('iso-8859-1').decode(textBytes).replace(/\0.*$/g, '').trim();
    } else if (encoding === 1) {
      // UTF-16 with BOM
      return new TextDecoder('utf-16').decode(textBytes).replace(/\0.*$/g, '').trim();
    } else if (encoding === 2) {
      // UTF-16BE
      return new TextDecoder('utf-16be').decode(textBytes).replace(/\0.*$/g, '').trim();
    } else if (encoding === 3) {
      // UTF-8
      return new TextDecoder('utf-8').decode(textBytes).replace(/\0.*$/g, '').trim();
    }
  } catch {
    // fallback
  }

  let str = '';
  for (let i = 0; i < textBytes.length; i++) {
    if (textBytes[i] === 0) break;
    str += String.fromCharCode(textBytes[i]);
  }
  return str.trim();
}

function extractApicImage(bytes: Uint8Array): string | undefined {
  try {
    if (bytes.length < 10) return undefined;
    let pos = 1; // skip encoding byte

    // MIME type string (terminated with 0x00)
    let mimeType = '';
    while (pos < bytes.length && bytes[pos] !== 0) {
      mimeType += String.fromCharCode(bytes[pos]);
      pos++;
    }
    pos++; // skip 0x00

    if (!mimeType) mimeType = 'image/jpeg';

    // Picture type byte (1 byte)
    pos++;

    // Description (terminated by 0x00 or 0x00 0x00)
    while (pos < bytes.length && bytes[pos] !== 0) {
      pos++;
    }
    pos++; // skip 0x00

    if (pos >= bytes.length) return undefined;

    const imgBytes = bytes.subarray(pos);
    const copy = new Uint8Array(imgBytes.length);
    copy.set(imgBytes);
    const blob = new Blob([copy], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}
