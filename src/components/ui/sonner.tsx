import { Toaster as Sonner, toast } from "sonner"
import type React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      expand={false}
      gap={10}
      offset={24}
      closeButton
      {...props}
    />
  )
}

export { Toaster, toast }
