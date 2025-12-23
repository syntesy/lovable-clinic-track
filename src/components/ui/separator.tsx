import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Root = SeparatorPrimitive.Root as any;

const Separator = React.forwardRef<HTMLDivElement, any>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <Root
      ref={ref}
      {...props}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
    />
  ),
);
Separator.displayName = "Separator";

export { Separator };
