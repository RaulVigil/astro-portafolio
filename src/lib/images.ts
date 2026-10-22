import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export type ResponsiveImage = {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
};

/**
 * Genera en build una versión WebP de `src` en cada ancho de `widths`, para usarla en
 * componentes React (que no pueden usar <Image> de astro:assets). El navegador elige
 * la variante según `sizes`; width/height reservan el espacio y evitan saltos (CLS).
 */
export async function responsiveImage(src: ImageMetadata, widths: number[], sizes: string): Promise<ResponsiveImage> {
  const image = await getImage({ src, widths, sizes, width: Math.max(...widths), format: 'webp' });
  return {
    src: image.src,
    srcSet: image.srcSet.attribute,
    sizes,
    width: Number(image.attributes.width),
    height: Number(image.attributes.height),
  };
}
