import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Toasts: bottom-center, dark ink background, white text, 3.2s.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      dir="rtl"
      position="bottom-center"
      duration={3200}
      className="toaster group"
      toastOptions={{
        style: {
          background: "var(--ink)",
          color: "#ffffff",
          border: "none",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          borderRadius: "10px",
          justifyContent: "center",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
