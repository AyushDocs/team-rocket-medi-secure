import Image from "next/image"
import Link from "next/link"

export function Logo({ className = "", showText = true, size = 40 }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group transition-all ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm group-hover:shadow-md transition-all duration-300">
        <Image
          src="/logo.png"
          alt="Sanjeevni Logo"
          width={size}
          height={size}
          className="object-contain p-1"
        />
      </div>
      {showText && (
        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#703FA1] via-[#5a2f81] to-[#3b1f55] tracking-tight">
          Sanjeevni
        </span>
      )}
    </Link>
  )
}
