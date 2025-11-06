import { PageSetup } from "@/types/pageSetup";

interface TitleBlockOverlayProps {
  pageSetup: PageSetup;
}

export const TitleBlockOverlay = ({ pageSetup }: TitleBlockOverlayProps) => {
  const titleBarHeightPx = pageSetup.layout.titleBarHeight;
  const logoSizePx = (pageSetup.layout.logoSize / 100) * titleBarHeightPx;

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-white text-black border-t-2 border-black pointer-events-none"
      style={{ height: `${titleBarHeightPx}px` }}
    >
      <div className="relative h-full flex items-stretch">
        {/* Logo section */}
        {pageSetup.logo && (
          <div 
            className="shrink-0 flex items-center justify-center bg-white border-r-2 border-black px-2"
            style={{ 
              width: `${logoSizePx * 1.5}px`
            }}
          >
            <img 
              src={pageSetup.logo} 
              alt="Logo" 
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: `${logoSizePx}px` }}
            />
          </div>
        )}

        {/* Text content - table-like layout */}
        <div className="flex-1 grid grid-cols-2 border-r-2 border-black">
          {/* Left column */}
          <div className="border-r border-black">
            {pageSetup.title && (
              <div className="border-b border-black px-2 py-1 flex items-center h-1/3">
                <span className="text-[10px] font-bold uppercase">Client: </span>
                <span className="text-xs ml-1">{pageSetup.title}</span>
              </div>
            )}
            <div className="border-b border-black px-2 py-1 flex items-center h-1/3">
              <span className="text-[10px] font-bold uppercase">Description: </span>
              <span className="text-xs ml-1">{pageSetup.subtitle || 'Floor Plan'}</span>
            </div>
            <div className="px-2 py-1 flex items-center h-1/3">
              <span className="text-[10px] font-bold uppercase">Job Address: </span>
              <span className="text-xs ml-1 truncate">{pageSetup.details || ''}</span>
            </div>
          </div>
          
          {/* Right column */}
          <div>
            <div className="border-b border-black px-2 py-1 flex items-center h-1/3">
              <span className="text-[10px] font-bold uppercase">File name: </span>
              <span className="text-xs ml-1">{pageSetup.footer || 'floor_plan.pdf'}</span>
            </div>
            <div className="border-b border-black px-2 py-1 flex items-center h-1/3">
              <span className="text-[10px] font-bold uppercase">Date: </span>
              <span className="text-xs ml-1">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="px-2 py-1 flex items-center h-1/3">
              <span className="text-[10px] font-bold uppercase">Sheet: </span>
              <span className="text-xs ml-1">1 of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
