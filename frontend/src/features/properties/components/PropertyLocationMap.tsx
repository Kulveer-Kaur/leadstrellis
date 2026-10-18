import { divIcon } from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

const pin = divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<span class="grid size-7 place-items-center rounded-full bg-surface shadow-float ring-1 ring-border"><span class="size-3 rounded-full bg-primary"></span></span>',
});

/** Small map centred on one listing (same tiles as the dashboard hotspot map). */
export function PropertyLocationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="relative h-56 overflow-hidden rounded-panel">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="ep-map absolute inset-0 z-0">
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxZoom={16} />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}" maxZoom={16} opacity={0.7} />
        <Marker position={[lat, lng]} icon={pin} />
      </MapContainer>
    </div>
  );
}
