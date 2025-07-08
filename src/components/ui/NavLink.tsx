'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  onClick?: () => void;
}

export default function NavLink({ 
  href, 
  children, 
  className = '',
  activeClassName = 'text-white',
  inactiveClassName = 'text-white/70 hover:text-white',
  onClick
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const combinedClassName = `${className} ${isActive ? activeClassName : inactiveClassName} transition-colors duration-200 text-sm font-medium`;

  return (
    <Link href={href} className={combinedClassName} onClick={onClick}>
      {children}
    </Link>
  );
} 