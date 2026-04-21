import { useState, useEffect } from "react";

export interface DatosGenerales {
  iva: number;
  impuestoElectrico: number;
  alquilerContador: number;
  bonoSocial: number;
  actualizadoEn: string;
}

export interface Descuento {
  tipo: "porcentaje" | "fijo";
  valor: number;
  meses: number | null;
  soloNuevosClientes?: boolean;
}

export interface TarifaDetalles {
  nombreTarifa: string;
  potenciaPunta: number;
  potenciaValle: number;
  energiaPunta: number;
  energiaLlana: number;
  energiaValle: number;
  incluyeBonoSocial?: boolean;
  mantenimientoPrecio?: number;
  descuento?: Descuento | null;
}

export interface Tarifa {
  comercializadora: string;
  detalles: TarifaDetalles;
}

export interface TarifasData {
  datosGenerales: DatosGenerales;
  tarifas: Tarifa[];
}

const CACHE_KEY = "tarifas_data_cache";
const CACHE_TIME_KEY = "tarifas_data_cache_time";
const CACHE_VERSION_KEY = "tarifas_data_cache_version";
const CACHE_VERSION = "3";
const CACHE_DURATION = 60 * 60 * 1000;

export function useTarifasData() {
  const [tarifasData, setTarifasData] = useState<TarifasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    const now = Date.now();

    if (
      cachedData &&
      cachedTime &&
      cachedVersion === CACHE_VERSION &&
      now - Number(cachedTime) < CACHE_DURATION
    ) {
      setTarifasData(JSON.parse(cachedData) as TarifasData);
      setIsLoading(false);
      return;
    }

    const saveAndSet = (data: TarifasData) => {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      setTarifasData(data);
      setIsLoading(false);
    };

    const doFetch = (url: string) =>
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Error fetching");
          return res.json() as Promise<TarifasData>;
        })
        .then(saveAndSet);

    doFetch("https://soker90.github.io/tarifas-luz/tarifas.json")
      .catch((err) => {
        console.error(err);
        if (cachedData) {
          setTarifasData(JSON.parse(cachedData) as TarifasData);
          setIsLoading(false);
        } else {
          setError("No se pudieron cargar las tarifas. Inténtalo más tarde.");
          setIsLoading(false);
        }
      });
  }, []);

  return { tarifasData, isLoading, error };
}
