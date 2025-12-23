import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const Root = ScrollAreaPrimitive.Root as any;
const Viewport = ScrollAreaPrimitive.Viewport as any;
const Scrollbar = ScrollAreaPrimitive.ScrollAreaScrollbar as any;
const Thumb = ScrollAreaPrimitive.ScrollAreaThumb as any;
const Corner = ScrollAreaPrimitive.Corner as any;

const ScrollArea = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
  <Root ref={ref} {...props} className={cn("relative overflow-hidden", className)}>
    <Viewport className="h-full w-full rounded-[inherit]">{children}</Viewport>
    <ScrollBar />
    <Corner />
  </Root>
));
ScrollArea.displayName = "ScrollArea";

const ScrollBar = React.forwardRef<HTMLDivElement, any>(({ className, orientation = "vertical", ...props }, ref) => (
  <Scrollbar
    ref={ref}
    {...props}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
  >
    <Thumb className="relative flex-1 rounded-full bg-border" />
  </Scrollbar>
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
