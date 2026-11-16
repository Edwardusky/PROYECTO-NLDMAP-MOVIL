
export const MAX_REPORT_PHOTO_BYTES = 5 * 1024 * 1024;

type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
  fileSize?: number | null;
  mimeType?: string | null;
};

export type PreparedPhoto = {
  uri: string;
  sizeBytes: number;
  optimized: boolean;
};

export class PhotoPreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoPreparationError";
  }
}

/**
 * Prepara una fotografía para el borrador de NLDMAP.
 *
 * - Conserva JPG/PNG válidos de hasta 5 MB.
 * - Convierte otras imágenes a JPEG.
 * - Reduce resolución y compresión progresivamente.
 * - Comprueba el archivo producido, no solo el original.
 */
export async function prepareReportPhoto(
  asset: PickedPhoto
): Promise<PreparedPhoto> {
  const { File } = await import("expo-file-system");

  function getFileSize(uri: string): number {
    return new File(uri).size;
  }

  const originalBytes =
    getFileSize(asset.uri) || asset.fileSize || 0;

  const mime = asset.mimeType?.toLowerCase();

  const isJpegOrPng =
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    (!mime && /\.(jpg|jpeg|png)(\?|$)/i.test(asset.uri));

  // Evitar recomprimir una fotografía que ya cumple
  // los requisitos de formato y tamaño.
  if (
    isJpegOrPng &&
    originalBytes > 0 &&
    originalBytes <= MAX_REPORT_PHOTO_BYTES
  ) {
    return {
      uri: asset.uri,
      sizeBytes: originalBytes,
      optimized: false,
    };
  }

  const ImageManipulator =
    await import("expo-image-manipulator");

  // Intentos de mayor a menor calidad.
  const attempts = [
    { maxSide: 2048, quality: 0.86 },
    { maxSide: 1800, quality: 0.78 },
    { maxSide: 1600, quality: 0.72 },
    { maxSide: 1400, quality: 0.68 },
  ];

  const width = asset.width;
  const height = asset.height;

  for (const attempt of attempts) {
    const context = ImageManipulator.ImageManipulator.manipulate(
      asset.uri
    );

    const longestSide = Math.max(width, height);

    // Solo reducir dimensiones, nunca ampliar la foto.
    if (
      width > 0 &&
      height > 0 &&
      longestSide > attempt.maxSide
    ) {
      if (width >= height) {
        context.resize({
          width: attempt.maxSide,
          height: null,
        });
      } else {
        context.resize({
          width: null,
          height: attempt.maxSide,
        });
      }
    }

    const rendered = await context.renderAsync();

    const result = await rendered.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: attempt.quality,
    });

    const finalBytes = getFileSize(result.uri);

    if (
      finalBytes > 0 &&
      finalBytes <= MAX_REPORT_PHOTO_BYTES
    ) {
      return {
        uri: result.uri,
        sizeBytes: finalBytes,
        optimized: true,
      };
    }
  }

  throw new PhotoPreparationError(
    "No fue posible reducir la fotografía a menos de 5 MB. " +
    "Selecciona otra imagen nítida o utiliza una foto de menor resolución."
  );
}
