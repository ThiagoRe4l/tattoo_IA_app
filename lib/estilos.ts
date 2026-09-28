export const ESTILOS_UI = [
  { id: "blackwork", rotulo: "Blackwork" },
  { id: "fineline", rotulo: "Fineline" },
  { id: "aquarela", rotulo: "Aquarela" },
  { id: "realismo-pb", rotulo: "Realismo P&B" },
  { id: "realismo-colorido", rotulo: "Realismo colorido" },
  { id: "old-school", rotulo: "Old School" },
  { id: "neo-tradicional", rotulo: "Neo-tradicional" },
  { id: "oriental", rotulo: "Oriental" },
  { id: "tribal", rotulo: "Tribal" },
  { id: "geometrico", rotulo: "Geométrico" },
  { id: "dotwork", rotulo: "Dotwork" },
  { id: "chicano", rotulo: "Chicano" },
  { id: "biomecanico", rotulo: "Biomecânico" },
  { id: "trash-polka", rotulo: "Trash Polka" },
] as const;

export type EstiloId = (typeof ESTILOS_UI)[number]["id"];
