import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Finanzas · Tu dinero, claro',description:'Tus suscripciones, pagos recurrentes y ahorro en un solo lugar.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/icon-192.png'},appleWebApp:{capable:true,statusBarStyle:'default',title:'Finanzas'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f6f8fc'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
