import { h, defineComponent, onMounted, onBeforeUnmount, watch, ref } from 'vue';
import L from 'leaflet';
// Import official Leaflet styles via standard package import
import 'leaflet/dist/leaflet.css';

export const PremiumMapRenderer = defineComponent({
  name: 'PremiumMapRenderer',
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    const mapContainerRef = ref<HTMLDivElement | null>(null);
    let mapInstance: L.Map | null = null;
    let markerGroup: L.FeatureGroup | null = null;

    // Helper: Map city names or records to realistic geographical coordinates
    const getCoordinates = (rec: any, idx: number): [number, number] => {
      // If record explicitly has latitude/longitude (standard Odoo fields partner_latitude/partner_longitude)
      const lat = rec.get ? rec.get('partner_latitude') : rec.partner_latitude;
      const lng = rec.get ? rec.get('partner_longitude') : rec.partner_longitude;
      if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }

      // Fallback: Map common city fields to coordinates
      const city = String(rec.get ? rec.get('city') || rec.get('street') || '' : rec.city || '').toLowerCase();
      if (city.includes('brussels')) return [50.8503, 4.3517];
      if (city.includes('san francisco')) return [37.7749, -122.4194];
      if (city.includes('paris')) return [48.8566, 2.3522];
      if (city.includes('london')) return [51.5074, -0.1278];
      if (city.includes('new york')) return [40.7128, -74.0060];
      if (city.includes('tokyo')) return [35.6762, 139.6503];

      // Jittered default cluster centered near Brussels (Odoo HQ)
      const baseLat = 50.8503;
      const baseLng = 4.3517;
      const jitterLat = (idx * 0.015) % 0.1 - 0.075;
      const jitterLng = (idx * 0.025) % 0.1 - 0.050;
      return [baseLat + jitterLat, baseLng + jitterLng];
    };

    const initMap = () => {
      if (!mapContainerRef.value || props.records.length === 0) return;

      // 1. Destroy existing map instance safely
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }

      // 2. Initialize fresh Leaflet map instance
      mapInstance = L.map(mapContainerRef.value, {
        zoomControl: true,
        attributionControl: false
      }).setView([50.8503, 4.3517], 11);

      // 3. Add beautiful responsive OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapInstance);

      // 4. Create premium inline SVG div icon to bypass missing asset bundle limits
      const customIcon = L.divIcon({
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; background: rgba(113, 75, 103, 0.3); border-radius: 50%; animation: pulse 2s infinite ease-in-out;"></div>
            <div style="position: relative; width: 12px; height: 12px; background: #714B67; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
          </div>
          <style>
            @keyframes pulse {
              0% { transform: scale(0.6); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          </style>
        `,
        className: 'o_map_pulsing_marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // 5. Populate marker group and cluster boundaries
      markerGroup = L.featureGroup().addTo(mapInstance);

      props.records.forEach((rec: any, idx: number) => {
        const coords = getCoordinates(rec, idx);
        const name = String(rec.get ? rec.get('name') || rec.get('display_name') : rec.name || 'Partner');
        const email = String(rec.get ? rec.get('email') || '' : rec.email || '');
        const cityStr = String(rec.get ? rec.get('city') || '' : rec.city || '');

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; padding: 4px; font-size: 13px; min-width: 140px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 600; color: #1e293b; font-size: 13px;">${name}</h4>
            ${email ? `<p style="margin: 0 0 2px 0; color: #64748b; font-size: 11px;">✉️ ${email}</p>` : ''}
            ${cityStr ? `<p style="margin: 0; color: #64748b; font-size: 11px;">📍 ${cityStr}</p>` : ''}
          </div>
        `;

        L.marker(coords, { icon: customIcon })
          .bindPopup(popupContent)
          .addTo(markerGroup!);
      });

      // 6. Automatically pan and zoom map view to perfectly encompass all marker pins
      try {
        if (markerGroup.getBounds().isValid()) {
          mapInstance.fitBounds(markerGroup.getBounds(), { padding: [40, 40] });
        }
      } catch (e) {
        // Fallback zoom in case of single pin coordinates
      }
    };

    onMounted(() => {
      initMap();
    });

    onBeforeUnmount(() => {
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    });

    watch(() => props.records, () => {
      initMap();
    }, { deep: true });

    return () => h('div', {
      style: 'background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 16px;'
    }, [
      h('div', { style: 'display: flex; flex-direction: column; gap: 4px;' }, [
        h('h3', { style: 'margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Interactive Geographic Map'),
        h('p', { style: 'margin: 0; font-size: 12px; color: #64748b;' }, 'Geographical analysis of active Odoo partners and regional clustering.')
      ]),
      h('div', {
        ref: mapContainerRef,
        style: 'width: 100%; height: 400px; border-radius: 6px; border: 1px solid #cbd5e1; z-index: 10;'
      })
    ]);
  }
});