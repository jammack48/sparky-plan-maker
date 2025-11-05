import { PageSetup } from "@/types/pageSetup";

interface TitleBlockOverlayProps {
  pageSetup: PageSetup;
}

export const TitleBlockOverlay = ({ pageSetup }: TitleBlockOverlayProps) => {
  const titleBarHeightPx = pageSetup.layout.titleBarHeight;
  const logoSizePx = (pageSetup.layout.logoSize / 100) * titleBarHeightPx;

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-muted/90 border-t border-border pointer-events-none"
      style={{ height: `${titleBarHeightPx}px` }}
    >
      <div className="relative h-full flex items-center px-3 gap-3">
        {/* Logo */}
        {pageSetup.logo && (
          <div 
            className={`shrink-0 ${
              pageSetup.layout.logoPosition === 'center' ? 'absolute left-1/2 -translate-x-1/2' :
              pageSetup.layout.logoPosition === 'right' ? 'absolute right-3' : ''
            }`}
            style={{ 
              width: `${logoSizePx}px`, 
              height: `${logoSizePx}px` 
            }}
          >
            <img 
              src={pageSetup.logo} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Text content */}
        <div className={`flex-1 min-w-0 ${
          pageSetup.layout.logoPosition === 'left' && pageSetup.logo ? 'ml-2' : ''
        }`}>
          {pageSetup.title && (
            <div className="font-bold text-foreground truncate" style={{ fontSize: '0.9rem' }}>
              {pageSetup.title}
            </div>
          )}
          {pageSetup.subtitle && (
            <div className="text-xs text-muted-foreground truncate">
              {pageSetup.subtitle}
            </div>
          )}
          {pageSetup.details && (
            <div className="text-xs text-muted-foreground/80 italic truncate">
              {pageSetup.details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
