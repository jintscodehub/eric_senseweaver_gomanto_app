import type { SVGProps } from 'react';

export function GomantoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Gomanto Logo</title>
      <path d="M12 2l7.79 7.79a2 2 0 0 1 0 2.82L12 22l-7.79-7.79a2 2 0 0 1 0-2.82L12 2z" />
      <path d="M12 2v20" />
      <path d="M21.79 9.79L2.21 9.79" />
      <path d="M16 4.5l-8 15" />
      <path d="M8 4.5l8 15" />
    </svg>
  );
}
