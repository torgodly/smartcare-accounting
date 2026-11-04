/**
 * Compress an image in the browser before upload:
 * max side 1800px, JPEG quality 0.85, transparent areas filled white.
 */
export async function compressImage(
    file: File,
    maxSide = 1800,
    quality = 0.85,
): Promise<Blob> {
    const bitmap = await loadImage(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
        return file;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap.source, 0, 0, width, height);
    bitmap.close();

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality);
    });
}

type LoadedImage = {
    source: CanvasImageSource;
    width: number;
    height: number;
    close: () => void;
};

async function loadImage(file: File): Promise<LoadedImage> {
    if ('createImageBitmap' in window) {
        try {
            const bitmap = await createImageBitmap(file, {
                imageOrientation: 'from-image',
            });

            return {
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                close: () => bitmap.close(),
            };
        } catch {
            // Fall back to an <img> element below.
        }
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await image.decode();

    return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
    };
}
