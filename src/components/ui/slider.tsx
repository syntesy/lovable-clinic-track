import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Root = SliderPrimitive.Root as any;
const Track = SliderPrimitive.Track as any;
const Range = SliderPrimitive.Range as any;
const Thumb = SliderPrimitive.Thumb as any;

const Slider = React.forwardRef<HTMLSpanElement, any>(({ className, ...props }, ref) => (
  <Root ref={ref} {...props} className={cn("relative flex w-full touch-none select-none items-center", className)}>
    <Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <Range className="absolute h-full bg-primary" />
    </Track>
    <Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </Root>
));
Slider.displayName = "Slider";

export { Slider };
