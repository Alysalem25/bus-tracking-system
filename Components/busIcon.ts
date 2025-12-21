// components/busIcon.ts
import L from "leaflet";

export const busIcon = new L.Icon({
  iconUrl: "/bus.png", // حط صورة الباص في public/
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});