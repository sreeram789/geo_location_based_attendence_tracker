// CSS module declarations
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Leaflet CSS declaration
declare module 'leaflet/dist/leaflet.css';

// Global CSS side-effect import
declare module '*.css';
