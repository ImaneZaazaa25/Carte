import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // ⚠️ CSS Leaflet indispensable

export default function App() {
  const [stations, setStations] = useState([]);

  const sensorIcon = L.divIcon({
    className: "sensor-icon",
    html: `
      <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 3C20.4 3 11 12.4 11 24c0 19.7 21 37.9 21 37.9S53 43.7 53 24C53 12.4 43.6 3 32 3Z"
                fill="#b31551"/>
          <circle cx="32" cy="24" r="10" fill="#b31551"/>
          <circle cx="32" cy="24" r="5.2" fill="#e3f2fd"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/stations")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur fetch stations");
        return res.json();
      })
      .then((data) => {
        console.log("JSON reçu du backend :", data); // <-- ici !
        setStations(data);
      })
      .catch((err) => console.error("Erreur fetch:", err));
  }, []);

  const center =
    stations.length > 0
      ? [stations[0].latitude, stations[0].longitude]
      : [34.05, -118.25];

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stations.map((station) => (
          <Marker
            key={station.stationId}
            position={[station.latitude, station.longitude]}
            icon={sensorIcon}
          >
            <Popup>
              <div>
                <strong>Capteur:</strong> {station.stationId}<br />
                <strong>Freeway:</strong> {station.fwy}<br />
                <strong>Direction:</strong> {station.dir}<br />
                <strong>District:</strong> {station.district}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}