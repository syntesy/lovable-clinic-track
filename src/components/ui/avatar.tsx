import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Root = AvatarPrimitive.Root as any;
const Image = AvatarPrimitive.Image as any;
const Fallback = AvatarPrimitive.Fallback as any;

const Avatar = React.forwardRef<HTMLSpanElement, any>(({ className, ...props }, ref) => (
  <Root
    ref={ref}
    {...props}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
  />
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<HTMLImageElement, any>(({ className, ...props }, ref) => (
  <Image ref={ref} {...props} className={cn("aspect-square h-full w-full", className)} />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLSpanElement, any>(({ className, ...props }, ref) => (
  <Fallback
    ref={ref}
    {...props}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
