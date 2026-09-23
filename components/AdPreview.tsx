import React, { useEffect, useRef, useState } from 'react';
import { Ratio } from '../types';
import { AdContent } from '../services/adContent';
import { renderAd, TemplateAssets } from '../services/adTemplates';
import { ensureFontsLoaded } from '../services/adRender';
import { getLogoAssets, loadImage, LogoAssets } from '../utils/logo';

/** Loads an image URL/data URL into an HTMLImageElement (null while loading or on error). */
export function useLoadedImage(src?: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let alive = true;
    setImg(null);
    if (!src) return;
    loadImage(src)
      .then((i) => alive && setImg(i))
      .catch(() => alive && setImg(null));
    return () => {
      alive = false;
    };
  }, [src]);
  return img;
}

let fontsReady: Promise<void> | null = null;

export function useBrandAssets(logoSrc?: string | null) {
  const [logo, setLogo] = useState<LogoAssets | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fontsReady = fontsReady || ensureFontsLoaded();
    Promise.all([fontsReady, getLogoAssets(logoSrc || undefined).catch(() => null)]).then(([, l]) => {
      if (!alive) return;
      setLogo(l);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [logoSrc]);
  return { logo, ready };
}

interface AdPreviewProps {
  content: AdContent;
  ratio: Ratio;
  baseSrc?: string | null;
  facultySrc?: string | null;
  logoSrc?: string | null;
  className?: string;
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
}

/** Renders a finished ad at full export resolution, scaled to fit via CSS. */
export const AdPreview: React.FC<AdPreviewProps> = ({ content, ratio, baseSrc, facultySrc, logoSrc, className, canvasRef }) => {
  const localRef = useRef<HTMLCanvasElement | null>(null);
  const base = useLoadedImage(baseSrc);
  const faculty = useLoadedImage(facultySrc);
  const { logo, ready } = useBrandAssets(logoSrc);

  useEffect(() => {
    const canvas = localRef.current;
    if (!canvas || !ready) return;
    const assets: TemplateAssets = { base, faculty, logo };
    renderAd(canvas, ratio, content, assets);
  }, [content, ratio, base, faculty, logo, ready]);

  return (
    <canvas
      ref={(el) => {
        localRef.current = el;
        if (canvasRef) canvasRef.current = el;
      }}
      className={className}
      style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }}
    />
  );
};
